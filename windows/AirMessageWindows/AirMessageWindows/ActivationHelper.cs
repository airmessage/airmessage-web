using System;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;
using Microsoft.Toolkit.Uwp.Notifications;
using Microsoft.UI.Xaml;
using PInvoke;
using Application = ABI.Microsoft.UI.Xaml.Application;

namespace AirMessageWindows
{
    public static class ActivationHelper
    {
        public const string ToastAction = "action";
        public const string ToastActionConversation = "viewConversation";
        public const string ToastActionConversationChat = "chatId";

        public static volatile Window MainWindow;
        public static volatile string? PendingChatId;
        public static event EventHandler<string>? ChatActivated;
        
        public static void ToastNotificationManagerCompatOnOnActivated(ToastNotificationActivatedEventArgsCompat e)
        {
            MainWindow.DispatcherQueue.TryEnqueue(() =>
            {
                //Activate window
                MainWindow.Activate();
                
                //Handle toast action
                ToastArguments args = ToastArguments.Parse(e.Argument);
                if(!args.Contains(ToastAction)) return;
                
                switch (args[ToastAction])
                {
                    case ToastActionConversation:
                    {
                        var chatId = args[ToastActionConversationChat];
                        if (ChatActivated != null)
                        {
                            ChatActivated.Invoke(null, chatId);
                        }
                        else
                        {
                            PendingChatId = chatId;
                        }

                        break;
                    }
                }
            });
        }
    }
}