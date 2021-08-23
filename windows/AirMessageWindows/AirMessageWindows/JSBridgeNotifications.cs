using System;
using System.IO;
using System.Threading.Tasks;
using Windows.ApplicationModel.Contacts;
using Windows.Storage;
using Microsoft.Toolkit.Uwp.Notifications;

namespace AirMessageWindows
{
    public static class JSBridgeNotifications
    {
        public static async Task SendNotification(string chatId, string? personId, string messageId, string chatName, string contactName, string message)
        {
            var thumbnailUri = await GetPersonId(personId);

            var builder = new ToastContentBuilder()
                .AddArgument("action", "viewConversation")
                .AddArgument("chatId", chatId)
                .AddHeader(chatId, chatName, $"action=viewConversation&chatId={chatId}")
                .AddText(contactName)
                .AddText(message);
            
            if (thumbnailUri != null)
            {
                builder.AddAppLogoOverride(thumbnailUri, ToastGenericAppLogoCrop.Circle);
            }

            builder.Show((toast) =>
            {
                toast.Group = chatId;
                toast.Tag = messageId;
            });
        }

        private static async Task<Uri?> GetPersonId(string? personId)
        {
            if (personId == null) return null;
            
            //Prepare thumbnail folder
            var parentFolder = ApplicationData.Current.TemporaryFolder;
            StorageFolder thumbnailFolder = await parentFolder.CreateFolderAsync(StorageHelper.FolderTempPeopleThumbnails, CreationCollisionOption.OpenIfExists);
                
            //Read contact data
            var store = await ContactManager.RequestStoreAsync();
            var contact = await store.GetContactAsync(personId);
            using var thumbnail = await contact.Thumbnail.OpenReadAsync();
                
            //Sanitize contact ID for Windows file name
            var thumbnailFileName = string.Join("_", contact.Id.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries)).TrimEnd('.');
            
            //Create or get thumbnail file
            StorageFile thumbnailFile;
            try
            {
                thumbnailFile = await thumbnailFolder.CreateFileAsync(thumbnailFileName, CreationCollisionOption.FailIfExists);
            }
            catch
            {
                try
                {
                    thumbnailFile = await thumbnailFolder.GetFileAsync(thumbnailFileName);
                }
                catch
                {
                    return null;   
                }
            }

            //Write thumbnail file
            await using var thumbnailFileStream = await thumbnailFile.OpenStreamForWriteAsync();
            await thumbnail.AsStreamForRead().CopyToAsync(thumbnailFileStream);
            
            return new Uri($"ms-appdata:///temp/{StorageHelper.FolderTempPeopleThumbnails}/{thumbnailFileName}");
        }

        public static void DismissNotifications(string chatId)
        {
            ToastNotificationManagerCompat.History.RemoveGroup(chatId);
        }
    }
}