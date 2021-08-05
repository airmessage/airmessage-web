using System;
using System.IO;
using System.Net;
using System.Text.Json;
using Windows.ApplicationModel.Contacts;
using Microsoft.UI.Xaml;
using Microsoft.Web.WebView2.Core;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace AirMessageWindows
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window {
        public MainWindow() {
            this.InitializeComponent();

            InitializeWebViewAsync();
        }

        async void InitializeWebViewAsync()
        {
            //Wait for initialization
            await MainWebView.EnsureCoreWebView2Async();
            
            //Load JavaScript bridge
            MainWebView.CoreWebView2.AddHostObjectToScript("contacts", new JSBridgeContacts());
            MainWebView.CoreWebView2.AddHostObjectToScript("connection", new JSBridgeConnection());
            
            ConnectionManager.Connected += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageData("connect")));
            ConnectionManager.Disconnected += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageData("disconnect")));
            ConnectionManager.MessageReceived += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageData<JSConnectionMessage>("message", new JSConnectionMessage(Convert.ToBase64String(args.Data), args.IsEncrypted))));
            
            //Capture requests for contact images
            MainWebView.CoreWebView2.AddWebResourceRequestedFilter(Constants.ContactURIPrefix + "*", CoreWebView2WebResourceContext.All);
            MainWebView.CoreWebView2.WebResourceRequested += CoreWebView2OnWebResourceRequested;
            
            //Map local file directory and load
            MainWebView.CoreWebView2.SetVirtualHostNameToFolderMapping("windowsweb.airmessage.org", "build", CoreWebView2HostResourceAccessKind.Allow);
            MainWebView.CoreWebView2.Navigate("https://windowsweb.airmessage.org");
        }

        private async void CoreWebView2OnWebResourceRequested(CoreWebView2 sender, CoreWebView2WebResourceRequestedEventArgs args)
        {
            var uri = new Uri(args.Request.Uri);
            if (uri.Host != "contact.airmessage.org") return;
            
            var contactId = uri.PathAndQuery;
            var deferral = args.GetDeferral();
            try
            {
                var store = await ContactManager.RequestStoreAsync();
                var contact = await store.GetContactAsync(contactId);
                var thumbnail = contact.Thumbnail;
                if (thumbnail != null)
                {
                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(await thumbnail.OpenReadAsync(), (int) HttpStatusCode.OK, null, null);
                    args.Response = response;
                    deferral.Complete();
                }
                else
                {
                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(null, (int) HttpStatusCode.NotFound, null, null);
                    args.Response = response;
                    deferral.Complete();
                }
            }
            catch (Exception exception)
            {
                Console.WriteLine(exception.Message);
                    
                var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(null, (int) HttpStatusCode.InternalServerError, null, null);
                args.Response = response;
                deferral.Complete();
            }
        }

        private void myButton_Click(object sender, RoutedEventArgs e) {
            //myButton.Content = "Clicked";
        }

        private static Stream GenerateStreamFromString(string s)
        {
            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);
            writer.Write(s);
            writer.Flush();
            stream.Position = 0;
            return stream;
        }
    }
}
