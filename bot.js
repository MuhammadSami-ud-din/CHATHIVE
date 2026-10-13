const bcrypt = require("bcrypt");
const pool = require('./config/db');


async function run(){
    
try{
   const [query] = await pool.query(`SELECT * FROM USERS`);
   console.log(query)

//     const hashedPassword = await registerUser("informationSecurityisamusttoleran")
//    const query = await pool.query(`INSERT INTO USERS(username , email , password_hash , is_bot)
//     VALUES (? ,? , ? , ?)` ,["Gemini(AI)" , "geminibot@gmail.com" , hashedPassword , true]);

    

   }
   catch(error){
//       console.error("MySQL Query Failed:", error.message, "Error Code:", error.code);

//     if (error.code ==='ER_DUP_ENTRY'){
//        console.log("email or username already exists")
//     }
//     console.log("Database error");
   }
}

async function registerUser(plainPassword) {
try{
    const salt= 10;

    const hashedPassword = await bcrypt.hash(plainPassword , salt);

    return hashedPassword;

}
catch(error){
    console.log(error.message);
    throw error;
}


}

run()
