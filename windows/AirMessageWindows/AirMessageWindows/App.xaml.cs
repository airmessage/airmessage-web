using System;
using System.IO;
using Microsoft.Toolkit.Uwp.Notifications;
using Microsoft.UI.Xaml;
using Sentry;
using System.Runtime.ExceptionServices;
using System.Security;
using System.Threading.Tasks;
using System.Xml;
using Windows.ApplicationModel;
using Windows.Storage;
using Package = Windows.ApplicationModel.Package;
using UnhandledExceptionEventArgs = Microsoft.UI.Xaml.UnhandledExceptionEventArgs;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace AirMessageWindows
{
    /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
    /// </summary>
    public partial class App : Application
    {
        private Window m_window;
        
        /// <summary>
        /// Initializes the singleton application object.  This is the first line of authored code
        /// executed, and as such is the logical equivalent of main() or WinMain().
        /// </summary>
        public App()
        {
            InitializeSentry().Wait();

            InitializeComponent();
        }

        /// <summary>
        /// Invoked when the application is launched normally by the end user.  Other entry points
        /// will be used such as when the application is launched to open a specific file.
        /// </summary>
        /// <param name="args">Details about the launch request and process.</param>
        protected override void OnLaunched(LaunchActivatedEventArgs args)
        {
            m_window = new MainWindow();
            m_window.Activate();
            
            //Register for activation events
            ActivationHelper.MainWindow = m_window;
            ToastNotificationManagerCompat.OnActivated += ActivationHelper.ToastNotificationManagerCompatOnOnActivated;
        }

        private static async Task InitializeSentry()
        {
#if !DEBUG
            //Load secrets file
            var secretsFile = await StorageFile.GetFileFromApplicationUriAsync(new Uri("ms-appx:///secrets.xml"));
            await using var secretsFileStream = await secretsFile.OpenStreamForReadAsync();
            XmlDocument secretsXml = new();
            secretsXml.Load(secretsFileStream);

            //Initialize Sentry
            SentrySdk.Init(new SentryOptions {
                Dsn = secretsXml.SelectSingleNode("/xml/sentryDSN")!.InnerText,
                Release = "airmessage-windows@" + GetAppVersion()
            });
            
            Current.UnhandledException += ExceptionHandler;
#endif
        }
        
        [HandleProcessCorruptedStateExceptions, SecurityCritical]
        private static void ExceptionHandler(object sender, UnhandledExceptionEventArgs e)
        {
            // We need to hold the reference, because the Exception property is cleared when accessed.
            var exception = e.Exception;
            if (exception == null) return;
            
            // Tells Sentry this was an Unhandled Exception
            exception.Data[Sentry.Protocol.Mechanism.HandledKey] = false;
            exception.Data[Sentry.Protocol.Mechanism.MechanismKey] = "Application.UnhandledException";
            SentrySdk.CaptureException(exception);
            // Make sure the event is flushed to disk or to Sentry
            SentrySdk.FlushAsync(TimeSpan.FromSeconds(3)).Wait();
        }
        
        public static string GetAppVersion()
        {
            Package package = Package.Current;
            PackageId packageId = package.Id;
            PackageVersion version = packageId.Version;

            return string.Format("{0}.{1}.{2}.{3}", version.Major, version.Minor, version.Build, version.Revision);
        }
    }
}
