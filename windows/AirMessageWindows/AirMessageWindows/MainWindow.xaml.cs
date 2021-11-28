using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Web;
using Windows.ApplicationModel.Contacts;
using Windows.System;
using Microsoft.UI.Xaml;
using Microsoft.Web.WebView2.Core;
using PInvoke;
using WinRT.Interop;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace AirMessageWindows
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            IgnoreNullValues = true
        };

        private static bool IsWebView2Installed()
        {
            try
            {
                CoreWebView2Environment.GetAvailableBrowserVersionString();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public MainWindow() {
            Title = "AirMessage";
            LoadIcon("AirMessage.ico");

            InitializeComponent();

            CheckWebView();
        }
        
        private void MainWindow_OnActivated(object sender, WindowActivatedEventArgs args)
        {
            //Re-check when the user activates the window again
            if (WebViewNotice.Visibility == Visibility.Visible)
            {
                CheckWebView();
            }
        }

        private void CheckWebView()
        {
            if (IsWebView2Installed())
            {
                //Initialize web view
                InitializeWebViewAsync();
                WebViewNotice.Visibility = Visibility.Collapsed;
                MainWebView.Visibility = Visibility.Visible;
            }
            else
            {
                //Prompt user to install web view
                WebViewNotice.Visibility = Visibility.Visible;
                MainWebView.Visibility = Visibility.Collapsed;
            }
        }

        async void InitializeWebViewAsync()
        {
            //Wait for initialization
            await MainWebView.EnsureCoreWebView2Async();
            
            //Configure settings
            MainWebView.CoreWebView2.Settings.IsZoomControlEnabled = false;
            
            //Register for incoming events
            MainWebView.CoreWebView2.NavigationStarting += CoreWebView2OnNavigationStarting;
            MainWebView.CoreWebView2.WebMessageReceived += CoreWebView2OnWebMessageReceived;

            //Post connection events
            ConnectionManager.Connected += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageSimple("connect"), JsonOptions));
            ConnectionManager.Disconnected += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageSimple("disconnect"), JsonOptions));
            ConnectionManager.MessageReceived += (sender, args) =>
                MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageNetwork("message", Convert.ToBase64String(args.Data), args.IsEncrypted), JsonOptions));

            //Capture requests for contact images
            MainWebView.CoreWebView2.AddWebResourceRequestedFilter(Constants.PersonUriPrefix + "*", CoreWebView2WebResourceContext.All);
            MainWebView.CoreWebView2.WebResourceRequested += CoreWebView2OnWebResourceRequested;

            //Map local file directory and load
            MainWebView.CoreWebView2.NewWindowRequested += CoreWebView2OnNewWindowRequested;
            MainWebView.CoreWebView2.SetVirtualHostNameToFolderMapping("windowsweb.airmessage.org", "webassets", CoreWebView2HostResourceAccessKind.Allow);
            MainWebView.Source = new Uri("https://windowsweb.airmessage.org/index.html");
        }

        private void CoreWebView2OnNavigationStarting(CoreWebView2 sender, CoreWebView2NavigationStartingEventArgs args)
        {
            //Disconnect from server
            ConnectionManager.Disconnect();
        }

        private async void CoreWebView2OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs args)
        {
            Debug.WriteLine("Received socket message " + args.WebMessageAsJson);
            using var doc = JsonDocument.Parse(args.WebMessageAsJson);

            switch (doc.RootElement.GetProperty("type").GetString()!)
            {
                //Platform
                case "registerActivations":
                {
                    //Post pending activations
                    if (ActivationHelper.PendingChatId != null)
                    {
                        MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageActivateChat("activateChat", ActivationHelper.PendingChatId)));
                        ActivationHelper.PendingChatId = null;
                    }

                    //Register for activation events
                    ActivationHelper.ChatActivated += (_, chatId) =>
                        MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageActivateChat("activateChat", chatId)));

                    break;
                }
                case "hasFocus":
                {
                    bool hasFocus = ApplicationIsActivated();
                    MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageHasFocus("hasFocus", hasFocus), JsonOptions));
                    break;
                }
                case "getSystemVersion":
                {
                    MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageSystemVersion("getSystemVersion", Environment.OSVersion.VersionString), JsonOptions));
                    break;
                }
                //People
                case "getPeople":
                {
                    List<JSPersonData> people = await JSBridgePeople.GetPeople();
                    MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageGetPeople("getPeople", people), JsonOptions));
                    break;
                }
                case "findPerson":
                {
                    string address = doc.RootElement.GetProperty("address").GetString()!;
                    JSPersonData? person = await JSBridgePeople.FindPerson(address);
                    MainWebView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new JSMessageFindPerson("findPerson", address, person), JsonOptions));
                    
                    break;
                }
                
                //Notifications
                case "showNotification":
                {
                    string chatId = doc.RootElement.GetProperty("chatID").GetString()!;
                    string? personId = doc.RootElement.GetProperty("personID").GetString();
                    string messageId = doc.RootElement.GetProperty("messageID").GetString()!;
                    string chatName = doc.RootElement.GetProperty("chatName").GetString()!;
                    string contactName = doc.RootElement.GetProperty("contactName").GetString()!;
                    string message = doc.RootElement.GetProperty("message").GetString()!;

                    User32.GetForegroundWindow();
                    Debug.WriteLine("Activation state: " + ApplicationIsActivated());
                    await JSBridgeNotifications.SendNotification(chatId, personId, messageId, chatName, contactName, message);
                    
                    break;
                }
                case "dismissNotifications":
                {
                    string chatId = doc.RootElement.GetProperty("chatID").GetString()!;
                    JSBridgeNotifications.DismissNotifications(chatId);

                    break;
                }
                //Connection
                case "connect":
                {
                    string hostname = doc.RootElement.GetProperty("hostname").GetString()!;
                    int port = doc.RootElement.GetProperty("port").GetInt32();
                    await ConnectionManager.Connect(hostname, port);
                    break;
                }
                case "send":
                {
                    byte[] data = doc.RootElement.GetProperty("data").GetBytesFromBase64();
                    await ConnectionManager.Send(data);
                    break;
                }
                case "disconnect":
                    ConnectionManager.Disconnect();
                    break;
            }
        }

        private async void CoreWebView2OnWebResourceRequested(CoreWebView2 sender, CoreWebView2WebResourceRequestedEventArgs args)
        {
            var uri = new Uri(args.Request.Uri);
            if (uri.Host != Constants.PersonUriHost) return;
            
            var contactId = HttpUtility.UrlDecode(uri.PathAndQuery[1..]);
            var deferral = args.GetDeferral();
            try
            {
                var store = await ContactManager.RequestStoreAsync();
                if (store == null)
				{
                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(null, (int) HttpStatusCode.NotFound, "Not Found", null);
                    args.Response = response;
                    deferral.Complete();

                    return;
				}

                var contact = await store.GetContactAsync(contactId);
                var thumbnail = contact.Thumbnail;
                if (thumbnail != null)
                {
                    using var thumbnailStream = await thumbnail.OpenReadAsync();
                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(thumbnailStream, (int) HttpStatusCode.OK, "OK", null);
                    args.Response = response;
                    deferral.Complete();
                }
                else
                {
                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(null, (int) HttpStatusCode.NotFound, "Not Found", null);
                    args.Response = response;
                    deferral.Complete();
                }
            }
            catch (Exception exception)
            {
                Console.WriteLine(exception.Message);
                    
                var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(null, (int) HttpStatusCode.InternalServerError, "Internal Server Error", null);
                args.Response = response;
                deferral.Complete();
            }
        }

        private static async void CoreWebView2OnNewWindowRequested(CoreWebView2 sender, CoreWebView2NewWindowRequestedEventArgs args)
        {
            args.Handled = true;
            await Launcher.LaunchUriAsync(new Uri(args.Uri));
        }
        
        private async void ButtonWebView2_OnClick(object sender, RoutedEventArgs e)
        {
            await Launcher.LaunchUriAsync(new Uri(@"https://go.microsoft.com/fwlink/p/?LinkId=2124703"));
        }
        
        private void LoadIcon(string iconName)
        {
            //Get the Window's HWND
            IntPtr hwnd = WindowNative.GetWindowHandle(this);
            
            //Get the app icon
            IntPtr hIcon = User32.LoadImage(IntPtr.Zero, iconName, User32.ImageType.IMAGE_ICON, 256, 256, User32.LoadImageFlags.LR_LOADFROMFILE);
            
            //Set the window's icon
            User32.SendMessage(hwnd, User32.WindowMessage.WM_SETICON, (IntPtr) 0, hIcon);
        }
        
        /// <summary>Returns true if the current application has focus, false otherwise</summary>
        public static bool ApplicationIsActivated()
        {
            var activatedHandle = User32.GetForegroundWindow();
            if (activatedHandle == IntPtr.Zero) {
                //No window is currently activated
                return false;
            }

            var procId = Environment.ProcessId;
            User32.GetWindowThreadProcessId(activatedHandle, out var activeProcId);

            return activeProcId == procId;
        }
    }
}
