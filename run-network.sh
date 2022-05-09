CONFIG='{
    "port": 8080,
    "endorsing_organizations":[
        {
            "name": "Warehouse"
        },
        {
            "name": "Platform"
        },
        {
            "name": "PepperEnterprise"
        },
        {
            "name": "Bank"
        }
    ],
    "channels":[
        {
            "name": "app-channel",
            "endorsing_organizations":[
                "Warehouse",
                "Platform", 
                "PepperEnterprise", 
                "Bank"
            ]
        },
        {
            "name": "admin-channel",
            "endorsing_organizations":[
                "Platform",
                "Bank"
            ]
        }
    ]
}'
export MICROFAB_CONFIG=${CONFIG}
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker run -e MICROFAB_CONFIG --label fabric-environment-name="PepperFin" -d -p  8080:8080 ibmcom/ibp-microfab 