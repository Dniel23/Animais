<<<<<<< HEAD
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

// Rota para criar um pagamento PIX (sem alterações)
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

// Rota para verificar o status do pagamento (sem alterações)
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
=======
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// --- 1. NOVAS IMPORTAÇÕES ---
// Importamos as classes necessárias do pdf-lib e o módulo 'fs' para ler a fonte
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;

// --- 2. MUDANÇA NA IMPORTAÇÃO do Mercado Pago ---
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 3. NOVA FORMA DE CONFIGURAÇÃO do Mercado Pago ---
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_TOKEN });
const payment = new Payment(client);

// Armazenamento temporário (em um projeto real, use um banco de dados)
const doacoes = {};

// --- ROTAS DA API ---

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

// --- 4. ROTA DE CERTIFICADO REESCRITA COM PDF-LIB ---
app.get('/gerar-certificado', async (req, res) => {
    const paymentId = req.query.id;

    if (!paymentId || !doacoes[paymentId] || doacoes[paymentId].status !== 'approved') {
        return res.status(403).send('Pagamento não confirmado ou inválido.');
    }

    const { nome, valor } = doacoes[paymentId];

    try {
        // Cria um novo documento PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // Tamanho A4
        const { width, height } = page.getSize();

        // Carrega fontes que usaremos
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Define cores
        const verdePrincipal = rgb(56 / 255, 142 / 255, 60 / 255); // #388E3C
        const laranjaSecundario = rgb(255 / 255, 160 / 255, 0 / 255); // #FFA000
        const textoEscuro = rgb(55 / 255, 71 / 255, 79 / 255); // #37474F

        // Desenha o conteúdo do certificado
        page.drawText('Certificado de Doação', {
            x: 50,
            y: height - 100,
            font: helveticaBold,
            size: 38,
            color: verdePrincipal,
        });

        page.drawText('Com imensa gratidão, certificamos que', {
            x: 50,
            y: height - 180,
            font: helvetica,
            size: 18,
            color: textoEscuro,
        });

        page.drawText(nome, {
            x: 50,
            y: height - 240,
            font: helveticaBold,
            size: 32,
            color: laranjaSecundario,
        });

        page.drawText(`realizou uma doação no valor de R$ ${valor.toFixed(2).replace('.', ',')}.`, {
            x: 50,
            y: height - 300,
            font: helvetica,
            size: 18,
            color: textoEscuro,
        });

        page.drawText('Sua generosidade e amor pelos animais fazem toda a diferença!', {
            x: 50,
            y: height - 350,
            font: helvetica,
            size: 16,
            color: textoEscuro,
        });

        page.drawText(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, {
            x: 50,
            y: 80,
            font: helvetica,
            size: 12,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Serializa o PDF para bytes
        const pdfBytes = await pdfDoc.save();

        // Envia o PDF como resposta
        res.setHeader('Content-Disposition', `attachment; filename=Certificado-Doacao-${nome}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Erro ao gerar PDF com pdf-lib:', error);
        res.status(500).send('Erro ao gerar o certificado.');
    }
});


app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    console.log('Aguardando doações... 🐾');
>>>>>>> 7c06c90b36308382b7a9ac53cdb784bc570f8806
});