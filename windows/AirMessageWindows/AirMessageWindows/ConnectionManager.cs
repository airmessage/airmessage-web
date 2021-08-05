using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Networking.Sockets;

namespace AirMessageWindows
{
    public static class ConnectionManager
    {
        public static event EventHandler? Connected;
        public static event EventHandler? Disconnected;
        public static event EventHandler<MessageReceivedEventArgs>? MessageReceived;
        private static StreamSocket? _socket;
        private static Stream? _writer;
        
        public static async void Connect(string hostname, int port)
        {
            try
            {
                //Connecting to the server
                _socket = new Windows.Networking.Sockets.StreamSocket();
                await _socket.ConnectAsync(new Windows.Networking.HostName(hostname), port.ToString());
                Connected?.Invoke(null, EventArgs.Empty);
                
                //Configuring the writer
                _writer = _socket.OutputStream.AsStreamForWrite();
                
                //Listening for new messages
                await using var stream = _socket.InputStream.AsStreamForRead();
                var bufferHeader = new byte[5];
                while (true)
                {
                    //Reading the header
                    await stream.ReadAsync(bufferHeader.AsMemory());
                    var contentLen = BitConverter.ToInt32(bufferHeader, 0);
                    var isEncrypted = BitConverter.ToBoolean(bufferHeader, 4);
                    
                    //Reading the body
                    var bufferContent = new byte[contentLen];
                    await stream.ReadAsync(bufferContent.AsMemory());
                    
                    //Calling event listeners
                    MessageReceived?.Invoke(null, new MessageReceivedEventArgs(bufferContent, isEncrypted));
                }
            } catch (Exception ex)
            {
                //Logging the error
                Console.Error.WriteLine(ex);
                
                //Emitting an event
                Disconnected?.Invoke(null, EventArgs.Empty);

                if (_socket != null)
                {
                    _socket.Dispose();
                    _socket = null;
                }
                
                //Cleaning up
                if (_writer != null)
                {
                    await _writer.DisposeAsync();
                    _writer = null;   
                }
            }
        }

        public static void Disconnect()
        {
            _socket?.Dispose();
            _socket = null;
        }
        
        public static async Task<bool> Send(byte[] data)
        {
            //Failing if there is no writer (we're disconnected)
            if (_writer == null)
            {
                return false;
            }

            await _writer.WriteAsync(data.AsMemory());

            return true;
        }
    }
    
    public class MessageReceivedEventArgs : EventArgs
    {
        public MessageReceivedEventArgs(byte[] data, bool isEncrypted)
        {
            Data = data;
            IsEncrypted = isEncrypted;
        }

        public byte[] Data { get; }
        public bool IsEncrypted { get; }
    }
}