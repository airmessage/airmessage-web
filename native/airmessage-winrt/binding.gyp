{
  "targets": [
    {
      "target_name": "main",
      "sources": [ "main.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
	  'cflags!': [ '-fno-exceptions' ],
 	  'cflags_cc!': [ '-fno-exceptions' ],
	  'defines': [ 'NAPI_CPP_EXCEPTIONS', 'NODE_ADDON_API_DISABLE_DEPRECATED' ],
	  'msvs_settings': {
         'VCCLCompilerTool': {
		  'ExceptionHandling': 1,
          'AdditionalOptions': [ '/std:c++17 /EHsc' ],
        }
      }
    }
  ]
}