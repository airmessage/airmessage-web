#pragma comment(lib, "windowsapp")

#include <napi.h>
#include <winrt/Windows.ApplicationModel.Contacts.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.Storage.h>
#include <winrt/Windows.Storage.Streams.h>
#include <winrt/base.h>

using namespace winrt::Windows::ApplicationModel::Contacts;
using namespace winrt::Windows::Foundation::Collections;

Napi::Object mapContact(Napi::Env env, Contact contact) {
	auto emails = contact.Emails();
	auto phones = contact.Phones();

	Napi::Object jsContact = Napi::Object::New(env);
	jsContact.Set("name", winrt::to_string(contact.FullName()));
			
	Napi::Array addressArray = Napi::Array::New(env, emails.Size() + phones.Size());
	for(int j = 0; j < emails.Size(); j++) {
		ContactEmail email = emails.GetAt(j);
				
		Napi::Object jsAddress = Napi::Object::New(env);
		jsAddress.Set("value", winrt::to_string(email.Address()));
		jsAddress.Set("displayValue", winrt::to_string(email.Address()));
		jsAddress.Set("type", "email");

		addressArray[j] = jsAddress;
	}

	for(int j = 0; j < phones.Size(); j++) {
		ContactPhone phone = phones.GetAt(j);

		Napi::Object jsAddress = Napi::Object::New(env);
		jsAddress.Set("value", winrt::to_string(phone.Number()));
		jsAddress.Set("displayValue", winrt::to_string(phone.Number()));
		jsAddress.Set("type", "phone");

		addressArray[emails.Size() + j] = jsAddress;
	}

	jsContact.Set("addresses", addressArray);

	return jsContact;
}

class GetContactsWorker : public Napi::AsyncWorker {
    public:
        GetContactsWorker(Napi::Function& callback) : AsyncWorker(callback) {}

        ~GetContactsWorker() {}
    // This code will be executed on the worker thread
    void Execute() override {
        //Fetch the user's contacts
  		ContactStore store = ContactManager::RequestStoreAsync().get();
  		allContacts = store.FindContactsAsync().get();
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());

		//Map to JS-compatible values
  		Napi::Array resultArray = Napi::Array::New(Env(), allContacts.Size());
  		for(int i = 0; i < allContacts.Size(); i++) {
	 		resultArray[i] = mapContact(Env(), allContacts.GetAt(i));
  		}

        Callback().Call({resultArray});
    }

	private:
		IVectorView<Contact> allContacts;
};

class FindContactWorker : public Napi::AsyncWorker {
    public:
        FindContactWorker(Napi::Function& callback, std::string& query) : AsyncWorker(callback), query(query) {}

        ~FindContactWorker() {}
    // This code will be executed on the worker thread
    void Execute() override {
        //Fetch the user's contacts
  		ContactStore store = ContactManager::RequestStoreAsync().get();
  		allContacts = store.FindContactsAsync(winrt::to_hstring(query)).get();
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());

		if(allContacts.Size() >= 1) {
			Callback().Call({mapContact(Env(), allContacts.GetAt(0))});
		} else {
			Callback().Call({Env().Undefined()});
		}
    }

	private:
		std::string query;
		IVectorView<Contact> allContacts;
};

Napi::Value GetContacts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Function callback = info[0].As<Napi::Function>();
  
  GetContactsWorker* wk = new GetContactsWorker(callback);
  wk->Queue();

  return info.Env().Undefined();
}

Napi::Value FindContact(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();

	std::string address = info[0].As<Napi::String>();
	Napi::Function callback = info[1].As<Napi::Function>();
	
	FindContactWorker* wk = new FindContactWorker(callback, address);
 	wk->Queue();

	return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "getContacts"), Napi::Function::New(env, GetContacts));
  exports.Set(Napi::String::New(env, "findContact"), Napi::Function::New(env, FindContact));
  return exports;
}

NODE_API_MODULE(hello, Init)