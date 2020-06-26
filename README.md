# socialnetwork-functions
Google Firebase Functions app which serves as REST API for [Social Network](https://bit.ly/2ABep1S). Find the front-end code [here](https://bit.ly/37z0jtT).

## Demo
Site: </br>
[Social Network](https://bit.ly/2ABep1S) </br>
</br>
REST API: </br>
[API](https://europe-west1-orion-socialnetwork.cloudfunctions.net/api/)

## Interface
Route: </br>
[https://europe-west1-orion-socialnetwork.cloudfunctions.net/api/](https://europe-west1-orion-socialnetwork.cloudfunctions.net/api/)


### /signup 
<p>
method: POST </br>
required fields:
<ul>
    <li>email             // String </li>
    <li>password          // String </li>  
    <li>confirmPassword   // String </li>
    <li>userHandle        // String </li>
</ul>
returns: </br>
<ul>
    <li>token             // String, JSON Web Token </li>
</ul>
</p>    

### /login 
<p>
method: POST </br>   
required fields: </br>
    email             <i>// String</i> </br>
    password          // String </br>
returns: </br>
    token             // String, JSON Web Token </br>
</p>
