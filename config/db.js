const mysql=require('mysql2');

const pool=mysql.createPool({
    host:'localhost',
    user:'root',
    password:'',
    database:'tfg',
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0
});

pool.getConnection((err, connection)=> {
    if(err){
        console.error(`Error al obtener la conexión: ${err.message}`);
    }
    else {
        console.log("Conexión exitosa a la base de datos.");
        connection.release();
    }
});

module.exports=pool.promise();