using System;
using System.IO;
using System.Threading.Tasks;
using System.Diagnostics;
using Windows.Networking.Sockets;

namespace AirMessageWindows
{
    public static class ConnectionManager
    {
        private const int HeaderSize = 4 + 1; //content length (int32) + is encrypted (boolean)
        
        public static event EventHandler? Connected;
        public static event EventHandler? Disconnected;
        public static event EventHandler<MessageReceivedEventArgs>? MessageReceived;
        private static StreamSocket? _socket;
        private static Stream? _writer;
        
        public static async Task Connect(string hostname, int port)
        {
            //Ignoring if we already have a connection
            if(_socket != null)
            {
                return;
            }

            Debug.WriteLine($"Connecting to {hostname}:{port}");

            try
            {
                //Connecting to the server
                _socket = new StreamSocket();
                await _socket.ConnectAsync(new Windows.Networking.HostName(hostname), port.ToString());
                Debug.WriteLine($"Connected to {hostname}:{port}");
                Connected?.Invoke(null, EventArgs.Empty);

                //Configuring the writer
                _writer = _socket.OutputStream.AsStreamForWrite();

                //Listening for new messages
                await using var stream = _socket.InputStream.AsStreamForRead();
                int pendingReadLength;
                byte[] bufferHeader = new byte[HeaderSize];
                while (true)
                {
                    pendingReadLength = HeaderSize;

                    //Reading the header
                    while (pendingReadLength > 0)
                    {
                        int readCount = await stream.ReadAsync(bufferHeader.AsMemory(HeaderSize - pendingReadLength, pendingReadLength));
                        if (readCount == 0)
                        {
                            goto Cleanup;
                        }

                        pendingReadLength -= readCount;
                    }

                    //Java is big endian
                    if (BitConverter.IsLittleEndian)
                    {
                        Array.Reverse(bufferHeader, 0, 4);
                    }

                    int contentLen = BitConverter.ToInt32(bufferHeader, 0);
                    bool isEncrypted = BitConverter.ToBoolean(bufferHeader, 4);

                    //Reading the body
                    pendingReadLength = contentLen;
                    byte[] bufferContent = new byte[contentLen];
                    while (pendingReadLength > 0)
                    {
                        int readCount = await stream.ReadAsync(bufferContent.AsMemory(contentLen - pendingReadLength, pendingReadLength));
                        if (readCount == 0)
                        {
                            goto Cleanup;
                        }

                        pendingReadLength -= readCount;
                    }

                    Debug.WriteLine($"Received web message {contentLen} / {isEncrypted}");

                    //Calling event listeners
                    MessageReceived?.Invoke(null, new MessageReceivedEventArgs(bufferContent, isEncrypted));
                }
            }
            catch (Exception ex)
            {
                //Logging the error
                Console.Error.WriteLine(ex);
                Debug.WriteLine(ex);
            }
            
            Cleanup:
            Debug.WriteLine($"Disconnected from {hostname}:{port}");
                
            //Emitting an event
            Disconnected?.Invoke(null, EventArgs.Empty);
                
            if (_socket != null)
            {
                try
                {
                    _socket.Dispose();
                }
                catch (ObjectDisposedException) { }
                _socket = null;
            }
                
            //Cleaning up
            if (_writer != null)
            {
                try
                {
                    await _writer.DisposeAsync();
                }
                catch (ObjectDisposedException) { }
                _writer = null;   
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

            Debug.WriteLine($"Sending {data.Length} bytes");

            await _writer.WriteAsync(data.AsMemory());
            await _writer.FlushAsync();

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