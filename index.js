require('dotenv').config(); // .env 파일 로드

const express = require('express');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // .env에서 API 키 가져오기

// 현재 시간을 yyyy-mm-dd hh:mm:ss 형식으로 반환하는 함수
function getFormattedTimestamp() {
    const now = new Date();
    return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
}

// GPT-4 API 호출을 처리하는 엔드포인트
app.post('/fill', async (req, res) => {
    console.log(`[${getFormattedTimestamp()}] 요청 받음:`, req.body);

    const { prompt, formData } = req.body;
    if (!prompt || !formData) {
        console.log(`[${getFormattedTimestamp()}] 요청이 잘못됨: prompt 또는 formData 없음`);
        return res.status(400).json({ success: false, error: "Missing prompt or formData" });
    }

    try {
        console.log(`[${getFormattedTimestamp()}] OpenAI API 호출 중...`);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are an AI assistant that matches form fields based on labels, names, and placeholders." },
                    { role: "user", content: `Given this form structure: ${JSON.stringify(req.body.formData)}\nFill it with appropriate values.` }
                ],
                max_tokens: 200
            })
        });

        console.log(`[${getFormattedTimestamp()}] OpenAI 응답 수신`);
        const data = await response.json();

        // OpenAI API 응답 전체 출력
        console.log(`[${getFormattedTimestamp()}] OpenAI 응답 데이터:`, JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.log(`[${getFormattedTimestamp()}] OpenAI API 에러:`, data);
            return res.status(500).json({ success: false, error: data });
        }

        console.log(`[${getFormattedTimestamp()}] 응답 전송 중...`);
        res.json({ success: true, values: data.choices[0].message.content });

        // 최종 응답값 로그 출력
        console.log(`[${getFormattedTimestamp()}] 최종 응답 값:`, data.choices[0].message.content);

    } catch (error) {
        console.error(`[${getFormattedTimestamp()}] 에러 발생:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`[${getFormattedTimestamp()}] 🚀 Server running on http://localhost:${PORT}`);
});
