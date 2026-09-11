const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());


// ============================================================
// FRONTEND
// ============================================================

app.use(express.static(path.join(__dirname, "../frontend")));


// ============================================================
// BANCO DE DADOS
// ============================================================

const DB_FILE = path.join(__dirname, "db.json");


function readDB() {

  if (!fs.existsSync(DB_FILE)) {

    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      altas: []
    };

  }


  const db = JSON.parse(
    fs.readFileSync(DB_FILE, "utf8")
  );


  // Garante que as estruturas existam
  // mesmo em um db.json antigo.

  if (!db.usuarios) {
    db.usuarios = [];
  }

  if (!db.pacientes) {
    db.pacientes = [];
  }

  if (!db.triagens) {
    db.triagens = [];
  }

  if (!db.consultas) {
    db.consultas = [];
  }

  if (!db.altas) {
    db.altas = [];
  }


  return db;

}


function writeDB(data) {

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2)
  );

}


// ============================================================
// LOGIN
// ============================================================

app.post("/login", (req, res) => {

  const db = readDB();


  const usuario =
    req.body.usuario || "";

  const senha =
    req.body.senha || "";


  const user =
    db.usuarios.find(u =>
      u.usuario === usuario &&
      u.senha === senha
    );


  if (!user) {

    return res.status(401).json({
      erro: "Login inválido"
    });

  }


  res.json(user);

});


// ============================================================
// ATENDIMENTO
// ============================================================

// CADASTRAR PACIENTE

app.post("/atendimento", (req, res) => {

  const db = readDB();


  const paciente = {

    id: Date.now(),

    nome:
      req.body.nome || "",

    cpf:
      req.body.cpf || "",

    dataNascimento:
      req.body.dataNascimento || "",

    sexo:
      req.body.sexo || "",

    nomeMae:
      req.body.nomeMae || "",

    estadoCivil:
      req.body.estadoCivil || "",


    endereco: {

      cep:
        req.body.endereco?.cep || "",

      logradouro:
        req.body.endereco?.logradouro || "",

      numero:
        req.body.endereco?.numero || "",

      complemento:
        req.body.endereco?.complemento || "",

      bairro:
        req.body.endereco?.bairro || "",

      cidade:
        req.body.endereco?.cidade || "",

      estado:
        req.body.endereco?.estado || ""

    },


    telefone:
      req.body.telefone || "",

    email:
      req.body.email || "",


    contatoEmergencia: {

      nome:
        req.body.contatoEmergencia?.nome || "",

      telefone:
        req.body.contatoEmergencia?.telefone || "",

      parentesco:
        req.body.contatoEmergencia?.parentesco || ""

    },


    tipo:
      req.body.tipo || "",

    convenio:
      req.body.convenio || "",


    status:
      "triagem",


    createdAt:
      new Date().toISOString()

  };


  db.pacientes.push(paciente);

  writeDB(db);


  console.log(
    "PACIENTE CADASTRADO:"
  );

  console.log(paciente);


  res.status(201).json(paciente);

});


// LISTAR PACIENTES

app.get("/pacientes", (req, res) => {

  const db = readDB();

  res.json(db.pacientes);

});


// ============================================================
// TRIAGEM
// ============================================================

app.post("/triagem", (req, res) => {

  const db = readDB();


  let risco =
    req.body.risco;


  const temperatura =
    Number(req.body.temperatura);


  // Regras básicas de classificação

  if (temperatura >= 39) {

    risco = "vermelho";

  }

  else if (temperatura >= 38) {

    risco = "amarelo";

  }

  else if (!risco) {

    risco = "verde";

  }


  const triagem = {

    id: Date.now(),

    nome:
      req.body.nome || "",

    sintoma:
      req.body.sintoma || "",

    temperatura:
      temperatura || 0,

    alergia:
      req.body.alergia || "",

    observacao:
      req.body.observacao || "",

    risco:


    risco,


    status:
      "aguardando_medico",


    createdAt:
      new Date().toISOString()

  };


  db.triagens.push(triagem);

  writeDB(db);


  console.log(
    "TRIAGEM REGISTRADA:"
  );

  console.log(triagem);


  res.status(201).json(triagem);

});


// ============================================================
// LISTAR TRIAGENS
// ============================================================

app.get("/triagens", (req, res) => {

  const db = readDB();

  res.json(db.triagens);

});


// ============================================================
// LISTA DE MEDICAÇÕES
// ============================================================

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


// ============================================================
// CONSULTA MÉDICA
// ============================================================

app.post("/consulta", (req, res) => {

  const db = readDB();


  const consulta = {

    id: Date.now(),

    paciente:
      req.body.paciente || "",

    diagnostico:
      req.body.diagnostico || "",

    medicacao:
      req.body.medicacao || "",

    obs:
      req.body.obs || "",

    createdAt:
      new Date().toISOString()

  };


  db.consultas.push(consulta);


  // Procura o paciente pelo nome.
  // Mantido assim para compatibilidade
  // com o medico.html atual.

  const paciente =
    db.pacientes.find(
      p => p.nome === consulta.paciente
    );


  if (paciente) {

    paciente.status =
      "atendimento_medico";

  }


  writeDB(db);


  console.log(
    "CONSULTA REGISTRADA:"
  );

  console.log(consulta);


  res.status(201).json(consulta);

});


// ============================================================
// MEDICAÇÕES
// ============================================================

app.get("/medicacoes", (req, res) => {

  const db = readDB();

  res.json(db.consultas);

});


// ============================================================
// ALTAS HOSPITALARES
// ============================================================

// SALVAR ALTA

app.post("/alta", (req, res) => {

  const db = readDB();


  const dados = req.body || {};


  // ----------------------------------------------------------
  // Validações básicas
  // ----------------------------------------------------------

  const nomePaciente =
    dados.paciente?.nome?.trim() || "";

  const diagnostico =
    dados.diagnostico?.trim() || "";

  const condicaoAlta =
    dados.condicaoAlta?.trim() || "";

  const dataAlta =
    dados.internacao?.dataAlta || "";

  const nomeMedico =
    dados.medico?.nome?.trim() || "";


  if (!nomePaciente) {

    return res.status(400).json({
      erro: "O nome do paciente é obrigatório."
    });

  }


  if (!diagnostico) {

    return res.status(400).json({
      erro: "O diagnóstico principal é obrigatório."
    });

  }


  if (!condicaoAlta) {

    return res.status(400).json({
      erro: "A condição do paciente no momento da alta é obrigatória."
    });

  }


  if (!dataAlta) {

    return res.status(400).json({
      erro: "A data da alta é obrigatória."
    });

  }


  if (!nomeMedico) {

    return res.status(400).json({
      erro: "O médico responsável é obrigatório."
    });

  }


  // ----------------------------------------------------------
  // Criação da alta
  // ----------------------------------------------------------

  const alta = {

    id: Date.now(),


    paciente: {

      nome:
        nomePaciente,

      cpf:
        dados.paciente?.cpf || "",

      dataNascimento:
        dados.paciente?.dataNascimento || "",

      prontuario:
        dados.paciente?.prontuario || ""

    },


    internacao: {

      dataEntrada:
        dados.internacao?.dataEntrada || "",

      dataAlta:
        dataAlta,

      motivo:
        dados.internacao?.motivo || ""

    },


    diagnostico:
      diagnostico,


    diagnosticosSecundarios:
      dados.diagnosticosSecundarios || "",


    procedimentos:
      dados.procedimentos || "",


    evolucao:
      dados.evolucao || "",


    condicaoAlta:
      condicaoAlta,


    orientacoes: {

      gerais:
        dados.orientacoes?.gerais || "",

      cuidadosCasa:
        dados.orientacoes?.cuidadosCasa || "",

      alimentacao:
        dados.orientacoes?.alimentacao || "",

      atividades:
        dados.orientacoes?.atividades || "",

      sinaisAlerta:
        dados.orientacoes?.sinaisAlerta || "",

      retorno:
        dados.orientacoes?.retorno || ""

    },


    medicamentos:
      Array.isArray(dados.medicamentos)
        ? dados.medicamentos
        : [],


    observacoes:
      dados.observacoes || "",


    medico: {

      nome:
        nomeMedico,

      crm:
        dados.medico?.crm || "",

      dataEmissao:
        dados.medico?.dataEmissao ||
        dataAlta

    },


    createdAt:
      new Date().toISOString()

  };


  // ----------------------------------------------------------
  // Salva a alta
  // ----------------------------------------------------------

  db.altas.push(alta);


  // ----------------------------------------------------------
  // Atualiza o status do paciente
  // ----------------------------------------------------------

  const paciente =
    db.pacientes.find(
      p => p.nome === nomePaciente
    );


  if (paciente) {

    paciente.status =
      "alta";

    paciente.dataAlta =
      dataAlta;

  }


  // ----------------------------------------------------------
  // Atualiza a triagem
  // ----------------------------------------------------------

  const triagem =
    [...db.triagens]
      .reverse()
      .find(
        t => t.nome === nomePaciente
      );


  if (triagem) {

    triagem.status =
      "alta";

  }


  writeDB(db);


  console.log(
    "ALTA HOSPITALAR REGISTRADA:"
  );

  console.log(alta);


  res.status(201).json({

    mensagem:
      "Alta hospitalar registrada com sucesso.",

    alta

  });

});


// ============================================================
// LISTAR ALTAS
// ============================================================

app.get("/altas", (req, res) => {

  const db = readDB();

  res.json(db.altas);

});


// ============================================================
// BUSCAR UMA ALTA PELO ID
// ============================================================

app.get("/alta/:id", (req, res) => {

  const db = readDB();


  const id =
    Number(req.params.id);


  const alta =
    db.altas.find(
      a => a.id === id
    );


  if (!alta) {

    return res.status(404).json({

      erro:
        "Alta hospitalar não encontrada."

    });

  }


  res.json(alta);

});


// ============================================================
// START
// ============================================================

const PORT =
  process.env.PORT || 3000;


app.listen(PORT, () => {

  console.log(
    `Servidor rodando na porta ${PORT}`
  );

});
