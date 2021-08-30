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
    
    public readonly struct JSMessageGetPeople
    {
        public JSMessageGetPeople(string type, IList<JSPersonData> people)
        {
            this.type = type;
            this.people = people;
        }

        public string type { get; }
        public IList<JSPersonData> people { get; }
    }

    public readonly struct JSMessageFindPerson
    {
        public JSMessageFindPerson(string type, string address, JSPersonData? person)
        {
            this.type = type;
            this.address = address;
            this.person = person;
        }

        public string type { get; }
        public string address { get; }
        public JSPersonData? person { get; }
    }
    
    public readonly struct JSMessageActivateChat
    {
        public JSMessageActivateChat(string type, string chatID)
        {
            this.type = type;
            this.chatID = chatID;
        }

        public string type { get; }
        public string chatID { get; }
    }
    
    public readonly struct JSMessageHasFocus
    {
        public JSMessageHasFocus(string type, bool hasFocus)
        {
            this.type = type;
            this.hasFocus = hasFocus;
        }

        public string type { get; }
        public bool hasFocus { get; }
    }
    
    public readonly struct JSMessageSystemVersion
    {
        public JSMessageSystemVersion(string type, string systemVersion)
        {
            this.type = type;
            this.systemVersion = systemVersion;
        }

        public string type { get; }
        public string systemVersion { get; }
    }
}