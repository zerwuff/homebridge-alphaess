

# Alpha - ESS Hombridge Plugin

This plugin connects the alpha ess cloud to homebridge.


# Features 

 - Show Battery Percentage  (currently as light bulb)

# Installation in Homebridge:

- 
 

 # Configuration

   "accessories": [
        {
            "accessory": "homebridge-alphaess-accessory",
            "name": "Battery",
            "username": "<YourAlphaEssCloudUsername>", 
            "password": "<YourAlphaEssCloudPassword>",
            "logrequestdata": "false",
            "serialnumber": "<YourAlphaEesCloudSerialNumberOfDevice>"
        }
    ],