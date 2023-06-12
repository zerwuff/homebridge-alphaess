
# Alpha - ESS Homebridge Plugin

This plugin connects the alpha ess cloud to homebridge and provides 2 accessories:
 
 - the alpha ess battery percentage as humidity sensor (0-100)% 
 - a contact sensor that is triggered, when the following thresholds are met:
   - power poading threshold (the generated sun power), eg. 1500w 
   - soc threshold , eg. 10% 
   this enables smart loading of ev batteries depending on the sun. thresholds are configurable
   


# Building 

 -  npm build && npm test

# Releasing

 - npm version minor && npm publish

# Features 

 - Show Battery Percentage  (currently as as humidity sensor to enable percentage view)


# Installation in Homebridge:

Install via plugins in the Homebridge Ui, search for :
```
 homebridge-alphaess
```

Click install and do the following configuration:

 # Configuration
```js
    plattforms: [
     {
            "name": "AlphaEssPlatform",
            "platform": "AlphaEssPlatform",
            "username": "XXXX",
            "password": "XXXX",
            "serialnumber": "AE3100520050057",        
            "logrequestdata": "false",        
            "powerLoadingThreshold": 1500, # generated sun power in watts to enable trigger
            "socLoadingThreshold": 10,    # lower threshold of soc to enable trigger
            "refreshTimerInterval": 60000,  # refresh time intervall in ms       
            "mqtt_url": "http://localhost:bla"
            "mqtt_status_topic": "/topic_for_alpha_ess_status_information",  # 
            "mqtt_trigger_topic_true": "/topic/to/on",
            "mqtt_trigger_topic_false": "/topic/to/off)",q
            "mqtt_trigger_message_true": "ON",
            "mqtt_trigger_message_false": "OFF",
            "power_image_filename":"/tmp/somefilename.png", # rendered output of todays statistics (PV & battery) - for camera / image exposing  
        }
    ],

```

Note: all mqtt_* parameters are optional if you do not want to use an mqtt broker.

##  MQTT Configuration parameters:

 - `mqtt_url` : a complete mqtt url, including username or password to the mqtt server. if this is omitted, no connection to mqtt is done and the 
following parameters are ignored.

 - `mqtt_status_topic` :  a topic name where alpha ess status data is sent to. currently, upon every data update, the following packet is sent to the topic:
```js
  
  { 
    "Time": "2023-02-27T15:08:20.818", 
    "ALPHA": 
    {
     "soc" : 33 ,        #  % of battery soc
     "totalPower": 5000  # total power of watts from the alpha ess system (ac & dc combined)
    } 
  }

```   

 - `mqtt_trigger_topic_true` :  a topic name where a trigger information is pushed to if the trigger condition is met 
 - `mqtt_trigger_message_true` :  a static message that is pushed to the mqtt_trigger_topic_true indicating that the trigger is met
 - `mqtt_trigger_topic_false` :  a topic name where a trigger information is pushed to if the trigger condition is not met 
 - `mqtt_trigger_message_false` :  a static message that is pushed to the mqtt_trigger_topic_true indicating that the trigger is not met
