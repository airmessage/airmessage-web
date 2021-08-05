using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace AirMessageWindows
{
    readonly struct JSConnectionParams
    {
        public string hostname { get; }
        public int port { get; }
    }
    
    public class JSBridgeConnection
    {
        public static void Connect(string dataString)
        {
            var connectionParams = JsonSerializer.Deserialize<JSConnectionParams>(dataString);
            ConnectionManager.Connect(connectionParams.hostname, connectionParams.port);
        }

        public static void Disconnect()
        {
            ConnectionManager.Disconnect();
        }
        
        public static Task<bool> Send(string dataString)
        {
            var data = Convert.FromBase64String(dataString);
            return ConnectionManager.Send(data);
        }
    }
}