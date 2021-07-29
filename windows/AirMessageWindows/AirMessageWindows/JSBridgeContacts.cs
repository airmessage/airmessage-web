using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Windows.ApplicationModel.Contacts;

namespace AirMessageWindows
{
    readonly struct JSAddressData
    {
        public JSAddressData(string value, string displayValue, string? label, string type)
        {
            this.value = value;
            this.displayValue = displayValue;
            this.label = label;
            this.type = type;
        }

        public string value { get; }
        public string displayValue { get; }
        public string? label { get; }
        public string type { get; }
    }

    readonly struct JSPersonData
    {
        public JSPersonData(string id, string name, string? avatar, IList<JSAddressData> addresses)
        {
            this.id = id;
            this.name = name;
            this.avatar = avatar;
            this.addresses = addresses;
        }
        
        public string id { get; }
        public string name { get; }
        public string? avatar { get; }
        public IList<JSAddressData> addresses { get; }
    }

    readonly struct JSContactData
    {
        public JSContactData(string name, string? avatar)
        {
            this.name = name;
            this.avatar = avatar;
        }

        public string name { get; }
        public string? avatar { get; }
    }
    
    class JSBridgeContacts
    {
        public async Task<List<JSPersonData>> GetContacts()
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

        public async Task<JSContactData?> FindContact(string address)
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
