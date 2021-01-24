use "testdb"

//Comando para ver los documentos de la colección. Observamos que dicha colección tiene 120.785 documentos.
db.Act02.find({})

//Cambiamos el tipo de dato del campo posted_date de string a Date. 
//Sobreescribimos la colección Act01 ($out) para que se guarden los cambios realizados. Esto debe ser hecho porque la función aggregate no guarda cambios.
db.Act02.aggregate([
    { $addFields: {
        posted_date: {
            $toDate: "$posted_date"
        }
    }},
    {$out : "Act02"}
])

//Segundo metodo. Demasiada carga computacional.

/*db.Act02.find().forEach(function(doc) { 
    doc.posted_date =new Date(doc.posted_date);
    db. Act01.save(doc); 
})*/


//Cambiar el formato a Date de occurred_date_time. 
/*db.Act02.aggregate([
    { $addFields: {
        occurred_date_time: {
            $toDate: "$occurred_date_time"
        }
    }},
    {$out: "Act02"}
])*/

//4
//4.1 Mostrar todos los documentos, con todos sus campos, que contienen avistamientos producidos en el estado de California (“CA”).
//Buscamos documentos donde los avistamientos se produjeron en el estado de CA. Puede realizarse mediante un find o un aggregate.
db.Act02.find({state: "CA"})
db.Act02.aggregate([
    {$match: {
        state: "CA"
    }}
])

//4.2 Mostrar solamente la fecha y hora del avistamiento (campo «ocurred_date_time»), forma («shape») de los avistamientos producidos en el estado de California (“CA”).
//Buscamos todos los documentos que tengan como estado CA y mostramos únicamente shape y occurred_date_time (por ello los igualamos a 1). 1: mostrar 0:ocultar. Por defecto se ocultan menos el _id, por eso le damos valor 0
db.Act02.find({state: "CA"}, {_id: 0, shape:1, occurred_date_time:1})

//4.3 ▸	Listar todos los tipos de formas reportadas, sin que estas aparezcan repetidas.

db.Act02.distinct("shape")

// 4.4▸	Encontrar el número total de documentos que no tienen el campo «ocurred_date_time».
//mediante un find podemos y $exist: false podemos comprobar cuantos documentos no contienen el campo <<occurred_date_time>>
db.Act02.find({'occurred_date_time': {$exists: false}})
db.Act02.find({'occurred_date_time': {$exists: false}}).count()

// 4.5▸	Encontrar el número total de documentos en los que falta por lo menos un campo por asignar.

db.Act02.find({
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

db.Act02.find({"summary": /alien/i}).count()
db.Act02.find({"summary": {$regex: /alien/i}}).count()
//Utilizando $regex podemos encontrar documentos que concuerden con una expresión regular dada.
db.Act02.aggregate([
    {$match: {
        "summary": {$regex: /alien/i}
    }}
])

// 4.7▸	Actualizar los documentos en los que la descripción del avistamiento contiene la palabra HOAX, añadiendo a estos un campo cuyo nombre sea «hoax_warning» y que tenga el valor ‘true’ de tipo booleano. El resto de campos del documento no debe sufrir modificación alguna.

db.Act02.aggregate([
    {$match: {
        summary: {$regex: /HOAX/i}
    }},
    {$addFields: {
        hoax_warning: true
    }}
]).forEach(function(x){ //Utilizamos el forEach para recorrer todos los documentos y actualizar únicamente los que tienes HOAX.
    db.Act02.save(x)
})
//Comprobamos que ha realizado la agregación correspondiente.
db.Act02.find({'hoax_warning': {$exists: true}})
//Comprobamos que el número total de documentos sigue siendo el mismo.
db.Act02.find({"summary":{$regex: /HOAX/i}}).count()

// 4.8▸	Mostrar todos los documentos, con todos sus campos, que contienen avistamientos reportados («posted_date») en el mes de marzo. 

//Con una agregación de 2 etapas, añadimos el campo month donde se guardarán los documentos en los que posted_date es equivalente a marzo y hacemos un match para para mostrar todos los docs de marzo.
db.Act02.aggregate([
    {$addFields: {
     month: { $month: "$posted_date"}
    }},
    {$match: {
        month:3
    }}
])

// 4.9▸	Para los documentos que contienen avistamientos reportados en el mes de marzo, listar sin repetir las ciudades en las que se han producido las llamadas.


//Como hemos hecho anteriormente, añadimos el campo month con los meses obtenidos de posted_date
//Filtramos únicamente los que corresponden al mes 3 y quitamos nulos en la ciudades. 
//agrupamos por ciudad para evitar duplicados.
db.Act02.aggregate([
    {$addFields: {
     month: { $month: "$posted_date"}
    }},
    {$match: {
        month:3
        city: {$ne: null} //Quitamos nulos
    }},
    {$group: { _id: {
        city: "$city"
    }}
])

// 4.10▸	Para los documentos que contienen avistamientos reportados en el mes de marzo, listar sin repetir las ciudades en las que se han producido las llamadas y mostrarlas ordenadas alfabéticamente.

//Mismo procedimiento que en el apartado anterior. Añadimos un sort al final para ordenar alfabeticamente. (Menor a mayor)
db.Act02.aggregate([
    {$project: {
     month: { $month: "$posted_date"}
     occurred_date_time: 1, city: 1, shape: 1,duration:1,summary:1, details_url:1
    }},
    {$match: {
        month:3
        city: {$ne: null} //Quitamos nulos
    }},
    {$group: { _id: {
        city: "$city"
    }},
    {$sort: {_id: 1}}
])

// 4.11▸	Para toda la colección, indicar los cinco estados en los que ha habido más avistamientos reportados.

//Mediante un match quitamos los documentos cuyo campo State es null, ya que entiendo que al preguntar por estados, se refiere únicamente a USA. 
//Con un group obtenemos el total de documentos por estado. 
//mediante un sort los ordenamos de mayor a menos y limitamos a 5 la salida.
db.Act02.aggregate([
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

db.Act02.aggregate([
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
         {_id:0,
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
