use "testdb"

//Comando para ver los documentos de la colección. Observamos que dicha colección tiene 120.785 documentos.
db.Act01.find({})

//Cambiamos el tipo de dato del campo posted_date de string a Date. 
//Sobreescribimos la colección Act01 ($out) para que se guarden los cambios realizados. Esto debe ser hecho porque la función aggregate no guarda cambios.
db.Act01.aggregate([
    { $addFields: {
        posted_date: {
            $toDate: "$posted_date"
        }
    }},
    {$out : "Act01"}
])

//Segundo metodo. Demasiada carga computacional.

/*db.Act01.find().forEach(function(doc) { 
    doc.posted_date =new Date(doc.posted_date);
    db. Act01.save(doc); 
})*/


//Cambiar el formato a Date de occurred_date_time. 
/*db.Act01.aggregate([
    { $addFields: {
        occurred_date_time: {
            $toDate: "$occurred_date_time"
        }
    }},
    {$out: "Act01"}
])*/

//4
//4.1 Mostrar todos los documentos, con todos sus campos, que contienen avistamientos producidos en el estado de California (“CA”).
//Buscamos documentos donde los avistamientos se produjeron en el estado de CA. Puede realizarse mediante un find o un aggregate.
db.Act01.find({state: "CA"})
db.Act01.aggregate([
    {$match: {
        state: "CA"
    }}
])

//4.2 Mostrar solamente la fecha y hora del avistamiento (campo «ocurred_date_time»), forma («shape») de los avistamientos producidos en el estado de California (“CA”).

db.Act01.find({state: "CA"}, {_id: 0, shape:1, occurred_date_time:1})

//4.3 ▸	Listar todos los tipos de formas reportadas, sin que estas aparezcan repetidas.

db.Act01.distinct("shape")

// 4.4▸	Encontrar el número total de documentos que no tienen el campo «ocurred_date_time».
//mediante un find podemos y $exist: false podemos comprobar cuantos documentos no contienen el campo <<occurred_date_time>>
db.Act01.find({'occurred_date_time': {$exists: false}})
db.Act01.find({'occurred_date_time': {$exists: false}}).count()

// 4.5▸	Encontrar el número total de documentos en los que falta por lo menos un campo por asignar.

db.Act01.find({
    $or: [
         {id: {$exists: false}},
         {occurred_date_time: {$exists: false}},
         {city: {$exists: false}},
         {state: {$exists: false}},
         {shape: {$exists: false}},
         {duration: {$exists: false}},
         {summary: {$exists: false}},
         {details_url: {$exists: false}}
        ]
}).count()
// 4.6▸	Contar el número de documentos que contiene la palabra “alien” en la descripción del avistamiento («summary»).

db.Act01.find({"summary": /alien/i}).count()
db.Act01.find({"summary": {$regex: /alien/i}}).count()

// 4.7▸	Actualizar los documentos en los que la descripción del avistamiento contiene la palabra HOAX, añadiendo a estos un campo cuyo nombre sea «hoax_warning» y que tenga el valor ‘true’ de tipo booleano. El resto de campos del documento no debe sufrir modificación alguna.

db.Act01.aggregate([
    {$match: {
        summary: {$regex: /HOAX/i}
    }},
    {$addFields: {
        hoax_warning: true
    }}
]).forEach(function(x){ //Utilizamos el forEach para recorrer todos los documentos y actualizar únicamente los que tienes HOAX.
    db.Act01.save(x)
})
//Comprobamos que ha realizado la agregación correspondiente.
db.Act01.find({'hoax_warning': {$exists: true}})
//Comprobamos que el número total de documentos sigue siendo el mismo.
db.Act01.find({"summary":{$regex: /HOAX/i}}).count()

// 4.8▸	Mostrar todos los documentos, con todos sus campos, que contienen avistamientos reportados («posted_date») en el mes de marzo. 
db.Act01.aggregate([
    {$project: {
     month: { $month: "$posted_date"}
     occurred_date_time: 1, city: 1, shape: 1,duration:1,summary:1, details_url:1
    }},
    {$match: {
        month:3
    }},
    {$out: "March"}
])

// 4.9▸	Para los documentos que contienen avistamientos reportados en el mes de marzo, listar sin repetir las ciudades en las que se han producido las llamadas.

db.Act01.aggregate([
    {$project: {
     month: { $month: "$posted_date"}
     occurred_date_time: 1, city: 1, shape: 1,duration:1,summary:1, details_url:1
    }},
    {$match: {
        month:3
    }},
    {$group: { _id: {
        city: "$city"
    }}
])

db.March.distinct("city")

// 4.10▸	Para los documentos que contienen avistamientos reportados en el mes de marzo, listar sin repetir las ciudades en las que se han producido las llamadas y mostrarlas ordenadas alfabéticamente.
db.Act01.aggregate([
    {$project: {
     month: { $month: "$posted_date"}
     occurred_date_time: 1, city: 1, shape: 1,duration:1,summary:1, details_url:1
    }},
    {$match: {
        month:3
    }},
    {$group: { _id: {
        city: "$city"
    }},
    {$sort: {_id: 1}}
])

// 4.11▸	Para toda la colección, indicar los cinco estados en los que ha habido más avistamientos reportados.

db.Act01.aggregate([
    {$match: {
        state:{
            $ne: null
        }
    },
    {$group: { _id:"$state", 
        Total: 
            {$sum: 1}}
    },
    {$sort: {Total: -1}},
    {$limit: 5}
])

// 4.12▸	Rellena el espacio en blanco de la siguiente query para que el resultado sea el porcentaje de avistamientos reportados en el que el objeto se describe con forma circular (‘circle’).

db.Act01.aggregate([
    {$addFields:
        {isCircle: 
            {$cond: 
                { 
                    if: { $eq: [ "$shape", "Circle" ] },
                    then: 1, 
                    else: 0 
                }
            }
        }
    },
    {$group: {
        _id: 0,
        total: {$sum: 1},
        totalCircles: {$sum: {$cond: [{$eq: ["$isCircle", 1]},1,0]}
    }},
    {$project:
         {"_id":0,
         "circle_shaped_ratio":
              {$round: [{$multiply:[{$divide: ["$totalCircles", "$total"]},100]},2]}
              
    }
])


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
