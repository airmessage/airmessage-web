namespace AirMessageWindows
{
    public readonly struct JSMessageData
    {
        public JSMessageData(string type)
        {
            this.type = type;
        }

        public string type { get; }
    }
    
    public readonly struct JSMessageData<T>
    {
        public JSMessageData(string type, T data)
        {
            this.type = type;
            this.data = data;
        }

        public string type { get; }
        public T data { get; }
    }

    public readonly struct JSConnectionMessage
    {
        public JSConnectionMessage(string data, bool isEncrypted)
        {
            this.data = data;
            this.isEncrypted = isEncrypted;
        }

        public string data { get; }
        public bool isEncrypted { get; }
    }
}