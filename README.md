# socialnetwork-functions
Google Firebase Functions app which serves as REST API for [Social Network](https://bit.ly/2ABep1S). Find the front-end code [here](https://bit.ly/37z0jtT).

## Demo
Site: [Social Network](https://bit.ly/2ABep1S)
REST API: [API](https://europe-west1-orion-socialnetwork.cloudfunctions.net/api/)

## Interface
Route: [https://europe-west1-orion-socialnetwork.cloudfunctions.net/api/](https://europe-west1-orion-socialnetwork.cloudfunctions.net/api/)

### /signup 
method: POST
required fields: 
    email             // String
    password          // String   
    confirmPassword   // String
    userHandle        // String
returns:
    token             // String, JSON Web Token 
    
### /login 
method: POST    
required fields: 
    email             // String
    password          // String 
returns:
    token             // String, JSON Web Token 
