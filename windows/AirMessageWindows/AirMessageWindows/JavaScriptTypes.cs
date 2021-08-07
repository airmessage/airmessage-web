using System.Collections.Generic;

namespace AirMessageWindows
{
    public readonly struct JSAddressData
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
    
    public readonly struct JSPersonData
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
    
    public readonly struct JSContactData
    {
        public JSContactData(string name, string? avatar)
        {
            this.name = name;
            this.avatar = avatar;
        }

        public string name { get; }
        public string? avatar { get; }
    }

    public readonly struct JSMessageSimple
    {
        public JSMessageSimple(string type)
        {
            this.type = type;
        }

        public string type { get; }
    }

    public readonly struct JSMessageNetwork
    {
        public JSMessageNetwork(string type, string data, bool isEncrypted)
        {
            this.type = type;
            this.data = data;
            this.isEncrypted = isEncrypted;
        }

        public string type { get; }
        public string data { get; }
        public bool isEncrypted { get; }
    }
    
    public readonly struct JSMessageGetContacts
    {
        public JSMessageGetContacts(string type, IList<JSPersonData> contacts)
        {
            this.type = type;
            this.contacts = contacts;
        }

        public string type { get; }
        public IList<JSPersonData> contacts { get; }
    }

    public readonly struct JSMessageFindContact
    {
        public JSMessageFindContact(string type, string address, JSContactData? contact)
        {
            this.type = type;
            this.address = address;
            this.contact = contact;
        }

        public string type { get; }
        public string address { get; }
        public JSContactData? contact { get; }
    }
}