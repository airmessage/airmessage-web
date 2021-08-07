using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Windows.ApplicationModel.Contacts;

namespace AirMessageWindows
{
    public static class JSBridgeContacts
    {
        public static async Task<List<JSPersonData>> GetContacts()
        {
            var store = await ContactManager.RequestStoreAsync();
            var contacts = await store.FindContactsAsync();
            return contacts.Select(contact => new JSPersonData(
                contact.Id,
                contact.FullName,
                contact.Thumbnail != null ? Constants.ContactURIPrefix + contact.Id : null,
                contact.Emails.Select(email => new JSAddressData(
                    email.Address,
                    email.Address,
                    null,
                    "email"
                    )).Concat(contact.Phones.Select(phone => new JSAddressData(
                    phone.Number,
                    phone.Number,
                    null,
                    "phone"
                    ))).ToList()
            )).ToList();
        }

        public static async Task<JSContactData?> FindContact(string address)
        {
            //Search for contact
            var store = await ContactManager.RequestStoreAsync();
            var contacts = await store.FindContactsAsync(address);
            
            //Return null if no contact was found
            if (!contacts.Any()) return null;
            
            //Map contact to JavaScript object and return
            var contact = contacts[0];
            return new JSContactData(
                contact.FullName,
                contact.Thumbnail != null ? Constants.ContactURIPrefix + contact.Id : null
            );
        }
    }
}
