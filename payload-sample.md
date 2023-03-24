## TMS - Target Microcontroller Sensors
```json
{ 
    "target_sensors": [ 
        { 
            "sensor": "", 
            "value": 0 
        } 
    ], 
    "current_state": { 
        "components": [ 
            { 
                "component": "", 
                "value": 0 
            } 
        ] 
    } 
}
```

### Inline
```json
{ "target_sensors": [ { "sensor": "", "value": 0 } ], "current_state": { "components": [ { "component": "", "value": 0 } ] } }
```

## MCSU - Microcontroller Components State Update
```json
{ 
    "state_update": { 
        "components": [ 
            { 
                "component": "", 
                "value": 0 
            } 
        ] 
    } 
}
```

### Inline
```json
{ "state_update": { "components": [ { "component": "", "value": 0 } ] } }
```

## CBS - Components Backup States
```json
{ 
    "backup": [ 
        {      
            "component": "led",
            "state_update": [
                {  
                    "value": 500
                },
                { 
                    "value": 600
                },
                { 
                    "value": 700
                }
            ],
            "schedule_timer": 1,
        },
        {      
            "component": "pump",
            "state_update": [
                {  
                    "value": 1
                },
                { 
                    "value": 0
                }
            ],
            "schedule_timer": 1,
        }
    ]  
}
```

## PSU - Periodic State Update
```json
{
   "psu": [
      {
         "order": 1,
         "state_update": {
            "components": [
               {
                  "component": "",
                  "value": 1
               }
            ]
         }
      },
      {
         "order": 2,
         "state_update": {
            "components": [
               {
                  "component": "",
                  "value": 0
               }
            ]
         }
      }
   ],
   "schedule_expression": ""
}
```

### Inline
```json
{ "psu": [ { "order": 1, "state_update": { "components": [ { "component": "", "value": 1 } ] } }, { "order": 2, "state_update": { "components": [ { "component": "", "value": 0 } ] } } ], "schedule_expression": "" }
```