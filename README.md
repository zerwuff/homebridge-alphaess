

# Alpha - ESS Hombridge Plugin

This plugin connects the alpha ess cloud to homebridge.


# Building 

 -  npm build && npm test

# Releasing

 - npm version minor && npm publish

# Features 

 - Show Battery Percentage  (currently as light bulb to enable percentage view)


# Installation in Homebridge:

Install via plugins in the Homebridge Ui, search for :
```
 homebridge-alphaess
```

Click install and do the following configuration:

 # Configuration
```js

   "accessories": [
        {
            "accessory": "homebridge-alphaess-accessory",
            "name": "Battery",
            "username": "<YourAlphaEssCloudUsername>", 
            "password": "<YourAlphaEssCloudPassword>",
            "logrequestdata": "false",
            "serialnumber": "<YourAlphaEesCloudSerialNumberOfDevice>",   
            "powerLoadingThreshold" : 1500, // minimum power to load, e.g 1500 watts  
            "socLoadingThreshold": 49 // minimum soc to load, e.g. 49%  
    }
    ],
```