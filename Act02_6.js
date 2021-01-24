//6. Establece, despliega, y crea los usuarios pertinentes para una política de permisos según la cual:

//6.1   ▸	solamente un usuario administrador pueda acceder a todas las bases de datos con todos los permisos
use "admin"
db.createUser(
   {
     user: "admin",
     pwd: "admin",
     roles: [ 
        "clusterAdmin",
        "readAnyDatabase",
        "readWriteAnyDatabase",
        "userAdminAnyDatabase",
        "dbAdminAnyDatabase"
     ]
     "authenticationRestrictions": []
   }
)
//6.2   ▸	cada base de datos tiene tener un usuario administrador de dicha base de datos, que tendrá todos los permisos en dicha base de datos, pero no podrá acceder a ninguna otra base de datos.
use "testdb"
db.createUser(
   {
     user: "admin1",
     pwd: "admin1",
     roles: [ 
        {role: "dbOwner", db: "testdb"}
     ]
   }
)

//6.3   ▸	existirán usuarios con permiso de lectura en una base de datos, sin ningún tipo de acceso a otras bases de datos.
db.createUser(
    {
     user: "user1",
     pwd: "1234",
     roles: [ {role:"read", db:"testdb"} ]
    }
)
db.createUser(
    {
     user: "user2",
     pwd: "1234",
     roles: [ {role:"read", db:"testdb"} ]
    }
)
db.createUser(
    {
     user: "user3",
     pwd: "4321",
     roles: [ {role:"read", db:"testdb"} ]
    }
)
