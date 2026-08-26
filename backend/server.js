const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");


// ==============================
// BANCO DE DADOS
// ==============================

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: []
    };
  }

  return JSON.parse(
    fs.readFileSync(DB_FILE, "utf8")
);

}

function writeDB(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2)
  );
}


// ==============================
// LOGIN
// ==============================

app.post("/login", (req, res) => {
  const db = readDB();

  const user = db.usuarios.find(u =>
    u.usuario === req.body.usuario &&
    u.senha === req.body.senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});


// ==============================
// ATENDIMENTO
// ==============================

// ATENDIMENTO
app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),

    nome: req.body.nome || "",
    cpf: req.body.cpf || "",
    dataNascimento: req.body.dataNascimento || "",
    sexo: req.body.sexo || "",
    nomeMae: req.body.nomeMae || "",
    estadoCivil: req.body.estadoCivil || "",

    endereco: {
      cep: req.body.endereco?.cep || "",
      logradouro: req.body.endereco?.logradouro || "",
      numero: req.body.endereco?.numero || "",
      complemento: req.body.endereco?.complemento || "",
      bairro: req.body.endereco?.bairro || "",
      cidade: req.body.endereco?.cidade || "",
      estado: req.body.endereco?.estado || ""
    },

    telefone: req.body.telefone || "",
    email: req.body.email || "",

    contatoEmergencia: {
      nome: req.body.contatoEmergencia?.nome || "",
      telefone: req.body.contatoEmergencia?.telefone || "",
      parentesco: req.body.contatoEmergencia?.parentesco || ""
    },

    tipo: req.body.tipo || "",
    convenio: req.body.convenio || "",

    status: "triagem",

    createdAt: new Date().toISOString()
  };

  db.pacientes.push(paciente);

  writeDB(db);

  console.log("PACIENTE CADASTRADO:");
  console.log(paciente);

  res.status(201).json(paciente);
});


// LISTAR PACIENTES
app.get("/pacientes", (req, res) => {
  const db = readDB();

  res.json(db.pacientes);
});



// ==============================
// TRIAGEM
// ==============================

app.post("/triagem", (req, res) => {
  const db = readDB();

  let risco = req.body.risco;

  if (req.body.temperatura >= 39) {
    risco = "vermelho";
  } else if (req.body.temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: req.body.temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco,
    status: "aguardando_medico",
    createdAt: new Date()
  };

  db.triagens.push(triagem);

  writeDB(db);

  res.json(triagem);
});


// ==============================
// LISTAR TRIAGENS
// ==============================

app.get("/triagens", (req, res) => {
  const db = readDB();

  res.json(db.triagens);
});


// ==============================
// LISTA DE MEDICAÇÕES
// ==============================

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});


// ==============================
// CONSULTA
// ==============================

app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date()
  };

  db.consultas.push(consulta);

  writeDB(db);

  res.json(consulta);
});


// ==============================
// MEDICAÇÕES
// ==============================

app.get("/medicacoes", (req, res) => {
  const db = readDB();

  res.json(db.consultas);
});


// ==============================
// LISTAR PACIENTES
// ==============================

app.get("/pacientes", (req, res) => {
  const db = readDB();

  res.json(db.pacientes);
});


// ==============================
// START
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

