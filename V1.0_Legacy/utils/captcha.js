const https = require('https');

async function verifyRecaptcha(token) {
    if (!token) return { success: false, error: 'No token provided' };
    
    const secret = process.env.RECAPTCHA_SECRET;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

    try {
        const recaptchaResult = await new Promise((resolve, reject) => {
            https.get(verifyUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', (err) => reject(err));
        });
        return recaptchaResult;
    } catch (err) {
        console.error('reCAPTCHA verification error:', err);
        return { success: false, error: 'Verification failed' };
    }
}

module.exports = { verifyRecaptcha };
