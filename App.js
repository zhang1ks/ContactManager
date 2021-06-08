/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  TextInput,
  Image,
} from 'react-native';

import Contacts from 'react-native-contacts';
import {PermissionsAndroid} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';

//The root component holds everything
const App = () => {
  const [contacts, setContacts] = useState([]);
  const [addNewContactClickable, setAddNewContactClickable] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [newContact, setNewContact] = useState({
    newContactName: '',
    newContactEmail: '',
    newContactPhoneNumber: '',
  });

  /**
   * @name addImage
   * @desc Fired when clicking on 'Add Image'
   * @return void
   */
  const addImage = id => {
    let options = {
      mediaType: 'photo',
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      } else if (response.errorCode === 'camera_unavailable') {
        return;
      } else if (response.errorCode === 'permission') {
        return;
      } else if (response.errorCode === 'others') {
        return;
      }

      let arrContacts = Array.from(contacts);
      let targetContact = arrContacts.find(con => con.recordID === id);
      targetContact.filePath = response.assets[0].uri;

      setContacts(arrContacts);
      setRefreshed(!refreshed);
    });
  };

  //READ CONTACTS
  const onPressImportContacts = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'Do you wish to sync your phone contacts with the app',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Contacts.getAll().then(allContacts => {
          setContacts(allContacts);
          setAddNewContactClickable(true);
        });
      } else {
      }
    } catch (err) {
      console.warn(err);
    }
  };

  //Save changes to update the Conacts[]
  const onSaveChanges = (id, newEmail, newPhoneNumber) => {
    let arrContacts = Array.from(contacts);
    let targetContact = arrContacts.find(con => con.recordID === id);

    if (targetContact.emailAddresses.length !== 0) {
      targetContact.emailAddresses[0].email = newEmail;
    } else {
      targetContact.emailAddresses.push({email: newEmail});
    }

    if (targetContact.phoneNumbers.length !== 0) {
      targetContact.phoneNumbers[0].number = newPhoneNumber;
    } else {
      targetContact.phoneNumbers.push({number: newPhoneNumber});
    }

    setContacts(arrContacts);
    setRefreshed(!refreshed);
  };

  //Add a new contact
  //And same here, I don't know if we need to input multiple phone numbers/email addresses,
  //so we create one only and put it the first place of Array to match the returned Contacts[] structure,
  //in the future, we can update the data structure on our side, or do more operations based on
  //different "type" values
  const onSubmitNewContact = () => {
    let arrContacts = Array.from(contacts);

    let newContactObject = {
      recordID: arrContacts.length + 1,
      displayName: newContact.newContactName,
      emailAddresses: [{email: newContact.newContactEmail}],
      phoneNumbers: [{number: newContact.newContactPhoneNumber}],
    };

    arrContacts.push(newContactObject);
    setContacts(arrContacts);
    setRefreshed(!refreshed);

    setNewContact({
      newContactName: '',
      newContactEmail: '',
      newContactPhoneNumber: '',
    });
    setIsAddingNewContact(false);
  };

  //Since I'm not sure if multiple phone numbers and email addresses are necessary in our case,
  //and we need the include phone number/email address in the new contact as well,
  //I just assume if there are multiple phone numbers/email addresses in Contatcs[],
  //we always take the very first one,
  //so we don't bother the "Type" of them just for quicker coding purpose, can be improved later
  const renderItem = ({item}) => (
    <ContactCard
      id={item.recordID}
      name={item.displayName}
      email={
        item.emailAddresses.length !== 0 ? item.emailAddresses[0].email : ''
      }
      phoneNumber={
        item.phoneNumbers.length !== 0 ? item.phoneNumbers[0].number : ''
      }
      onSaveChanges={onSaveChanges}
      addImage={addImage}
      filePath={item.filePath || ''}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={onPressImportContacts}>
          <Text style={styles.buttonText}>Import Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!addNewContactClickable}
          style={
            addNewContactClickable
              ? styles.button
              : {...styles.button, opacity: 0.5}
          }
          onPress={() => setIsAddingNewContact(!isAddingNewContact)}>
          <Text style={styles.buttonText}>Add a new contact</Text>
        </TouchableOpacity>
      </View>

      {isAddingNewContact && (
        <View style={styles.expandedInfoContainer}>
          <TextInput
            placeholder={'Name'}
            style={styles.textInput}
            onChangeText={text =>
              setNewContact({...newContact, newContactName: text})
            }
            value={newContact.newContactName}
          />
          <TextInput
            placeholder={'Email'}
            style={styles.textInput}
            onChangeText={text =>
              setNewContact({...newContact, newContactEmail: text})
            }
            value={newContact.newContactEmail}
          />
          <TextInput
            placeholder={'Phone'}
            style={styles.textInput}
            onChangeText={text =>
              setNewContact({...newContact, newContactPhoneNumber: text})
            }
            value={newContact.newContactPhoneNumber}
          />
          <TouchableOpacity style={styles.button} onPress={onSubmitNewContact}>
            <Text>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        style={styles.listContainer}
        data={contacts}
        renderItem={renderItem}
        keyExtractor={item => item.recordID}
        extraData={refreshed}
      />
    </SafeAreaView>
  );
};

//ContactCard that holds the each contact's detailed info needed
//let's treat it as a shared component.
//can be defined in Shared Components, put here for
//one page review purpose
const ContactCard = ({
  id,
  name,
  email,
  phoneNumber,
  onSaveChanges,
  addImage,
  filePath,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [shownEmail, onChangeEmail] = useState(email);
  const [shownPhoneNumber, onChangePhoneNumber] = useState(phoneNumber);

  const onPressContact = () => {
    setExpanded(!expanded);
  };

  return (
    <View>
      <TouchableOpacity style={styles.item} onPress={onPressContact}>
        <Text style={styles.title}>{name}</Text>
        {filePath !== '' && (
          <Image
            source={{uri: filePath}}
            style={styles.addedImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.expandedInfoContainer}>
          <TouchableOpacity onPress={() => addImage(id)}>
            <View style={styles.picturesRowItemContainer}>
              <View style={styles.addImageArea}>
                <View style={styles.addIconContainer}>
                  <Text style={styles.primaryText}>Add Photo</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            onChangeText={text => onChangeEmail(text)}
            value={shownEmail}
          />
          <TextInput
            style={styles.textInput}
            onChangeText={text => onChangePhoneNumber(text)}
            value={shownPhoneNumber}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setExpanded(!expanded);
              onSaveChanges(id, shownEmail, shownPhoneNumber);
            }}>
            <Text>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    marginVertical: 20,
  },
  buttonsContainer: {
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#707070',
    width: '45%',
    padding: 20,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
  item: {
    backgroundColor: '#99c2ff',
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
  expandedInfoContainer: {
    backgroundColor: '#99c2ff',
    padding: 20,
    marginHorizontal: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    marginVertical: 5,
  },
  addImageArea: {
    alignSelf: 'center',
    width: 95,
    height: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  addedImage: {
    width: 95,
    height: 95,
    borderRadius: 5,
  },
});

export default App;
