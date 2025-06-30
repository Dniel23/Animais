require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Adicionado para lidar com caminhos de arquivos

// A dependência 'pdf-lib' foi removida
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve arquivos estáticos da pasta 'public'
app.use(express.static('public'));

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_TOKEN });
const payment = new Payment(client);

const doacoes = {};

// Rota para criar um pagamento PIX
app.post('/gerar-pagamento', async (req, res) => {
    const { valor, nome } = req.body;

    if (!valor || !nome) {
        return res.status(400).json({ error: 'Nome e valor são obrigatórios.' });
    }

    const valorNumerico = parseFloat(valor.toString().replace(',', '.'));

    const payment_data = {
        transaction_amount: valorNumerico,
        description: 'Doação para projeto de apoio aos animais',
        payment_method_id: 'pix',
        payer: {
            email: `doador-${Date.now()}@teste.com`,
            first_name: nome,
        },
    };

    try {
        const data = await payment.create({ body: payment_data });
        doacoes[data.id] = {
            nome: nome,
            valor: valorNumerico,
            status: 'pending'
        };
        res.json({
            id: data.id,
            copia_e_cola: data.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64
        });
    } catch (error) {
        console.error('Erro Mercado Pago:', error);
        res.status(500).json({ error: 'Falha ao criar pagamento' });
    }
});

// Rota para verificar o status do pagamento
app.get('/status-pagamento/:id', async (req, res) => {
    const paymentId = req.params.id;
    try {
        const data = await payment.get({ id: paymentId });
        if (data.status === 'approved' && doacoes[data.id]) {
            doacoes[data.id].status = 'approved';
        }
        res.json({ status: data.status });
    } catch (error) {
        console.error('Erro ao consultar status:', error);
        res.status(500).json({ error: 'Falha ao consultar status' });
    }
});

// Rota de certificado simplificada com imagem
app.get('/gerar-certificado', (req, res) => {
    const paymentId = req.query.id;

    if (!paymentId || !doacoes[paymentId] || doacoes[paymentId].status !== 'approved') {
        return res.status(403).send('Pagamento não confirmado ou inválido.');
    }

    // Envia a imagem estática do certificado
    const imagePath = path.join(__dirname, 'public', 'certificado.png');
    res.sendFile(imagePath);
});


app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    console.log('Aguardando doações... 🐾');
});

app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    console.log('Aguardando doações... 🐾');
>>>>>>> 7c06c90b36308382b7a9ac53cdb784bc570f8806
});
