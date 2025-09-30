const request = require('supertest');
const { app, db } = require('./server');

beforeEach((done) => {
  db.run('DELETE FROM clientes', done);
});

afterAll((done) => {
  db.close(done);
});

describe('API de Clientes', () => {
  
  describe('POST /api/clientes', () => {
    it('deve cadastrar um novo cliente com sucesso', async () => {
      const novoCliente = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(novoCliente)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Cliente cadastrado com sucesso');
    });

    it('deve retornar erro quando faltar campos obrigatórios', async () => {
      const clienteIncompleto = {
        nome: 'João Silva',
        email: 'joao@email.com'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(clienteIncompleto)
        .expect(400);

      expect(response.body.error).toBe('Todos os campos são obrigatórios');
    });

    it('deve retornar erro ao tentar cadastrar email duplicado', async () => {
      const cliente = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      await request(app).post('/api/clientes').send(cliente);

      const clienteDuplicado = {
        nome: 'Maria Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4322',
        cpf: '123.456.789-01'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(clienteDuplicado)
        .expect(409);

      expect(response.body.error).toBe('Email ou CPF já cadastrado');
    });

    it('deve retornar erro ao tentar cadastrar CPF duplicado', async () => {
      const cliente = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      await request(app).post('/api/clientes').send(cliente);

      const clienteDuplicado = {
        nome: 'Maria Silva',
        email: 'maria@email.com',
        telefone: '(11) 98765-4322',
        cpf: '123.456.789-00'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(clienteDuplicado)
        .expect(409);

      expect(response.body.error).toBe('Email ou CPF já cadastrado');
    });
  });

  describe('GET /api/clientes', () => {
    it('deve retornar lista vazia quando não há clientes', async () => {
      const response = await request(app)
        .get('/api/clientes')
        .expect(200);

      expect(response.body.clientes).toEqual([]);
    });

    it('deve retornar lista de clientes cadastrados', async () => {
      const cliente1 = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      const cliente2 = {
        nome: 'Maria Santos',
        email: 'maria@email.com',
        telefone: '(11) 98765-4322',
        cpf: '123.456.789-01'
      };

      await request(app).post('/api/clientes').send(cliente1);
      await request(app).post('/api/clientes').send(cliente2);

      const response = await request(app)
        .get('/api/clientes')
        .expect(200);

      expect(response.body.clientes).toHaveLength(2);
      expect(response.body.clientes[0].nome).toBe('Maria Santos');
      expect(response.body.clientes[1].nome).toBe('João Silva');
    });
  });

  describe('GET /api/clientes/:id', () => {
    it('deve retornar um cliente específico', async () => {
      const novoCliente = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      const cadastro = await request(app)
        .post('/api/clientes')
        .send(novoCliente);

      const response = await request(app)
        .get(`/api/clientes/${cadastro.body.id}`)
        .expect(200);

      expect(response.body.cliente.nome).toBe('João Silva');
      expect(response.body.cliente.email).toBe('joao@email.com');
    });

    it('deve retornar erro 404 para cliente inexistente', async () => {
      const response = await request(app)
        .get('/api/clientes/9999')
        .expect(404);

      expect(response.body.error).toBe('Cliente não encontrado');
    });
  });

  describe('PUT /api/clientes/:id', () => {
    it('deve atualizar um cliente existente', async () => {
      const novoCliente = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      const cadastro = await request(app)
        .post('/api/clientes')
        .send(novoCliente);

      const clienteAtualizado = {
        nome: 'João Silva Santos',
        email: 'joao.santos@email.com',
        telefone: '(11) 98765-9999',
        cpf: '123.456.789-00'
      };

      const response = await request(app)
        .put(`/api/clientes/${cadastro.body.id}`)
        .send(clienteAtualizado)
        .expect(200);

      expect(response.body.message).toBe('Cliente atualizado com sucesso');

      const verificacao = await request(app)
        .get(`/api/clientes/${cadastro.body.id}`);

      expect(verificacao.body.cliente.nome).toBe('João Silva Santos');
    });

    it('deve retornar erro 404 ao atualizar cliente inexistente', async () => {
      const clienteAtualizado = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      const response = await request(app)
        .put('/api/clientes/9999')
        .send(clienteAtualizado)
        .expect(404);

      expect(response.body.error).toBe('Cliente não encontrado');
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('deve excluir um cliente existente', async () => {
      const novoCliente = {
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00'
      };

      const cadastro = await request(app)
        .post('/api/clientes')
        .send(novoCliente);

      const response = await request(app)
        .delete(`/api/clientes/${cadastro.body.id}`)
        .expect(200);

      expect(response.body.message).toBe('Cliente removido com sucesso');

      await request(app)
        .get(`/api/clientes/${cadastro.body.id}`)
        .expect(404);
    });

    it('deve retornar erro 404 ao excluir cliente inexistente', async () => {
      const response = await request(app)
        .delete('/api/clientes/9999')
        .expect(404);

      expect(response.body.error).toBe('Cliente não encontrado');
    });
  });
});