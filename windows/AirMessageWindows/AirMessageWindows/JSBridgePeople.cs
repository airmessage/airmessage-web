using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Windows.ApplicationModel.Contacts;

namespace AirMessageWindows
{
    public static class JSBridgePeople
    {
        public static async Task<List<JSPersonData>> GetPeople()
        {
            var store = await ContactManager.RequestStoreAsync();
            if(store == null) return new List<JSPersonData>();
            var contacts = await store.FindContactsAsync();
            return contacts.Select(MapContact).ToList();
        }

        public static async Task<JSPersonData?> FindPerson(string address)
        {
            //Search for contact
            var store = await ContactManager.RequestStoreAsync();
            if (store == null) return null;

            var contacts = await store.FindContactsAsync(address);
            
            //Return null if no contact was found
            if (!contacts.Any()) return null;
            
            //Map contact to JavaScript object and return
            return MapContact(contacts[0]);
        }

        private static JSPersonData MapContact(Contact contact)
        {
            return new JSPersonData(
                contact.Id,
                contact.FullName,
                contact.Thumbnail != null ? Constants.PersonUriPrefix + HttpUtility.UrlEncode(contact.Id) : null,
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
            );
        }
    }
}
