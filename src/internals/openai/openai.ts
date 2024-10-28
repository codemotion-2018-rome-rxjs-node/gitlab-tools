import { from, map } from "rxjs";
import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY; // Store your API key in environment variables
const client = new OpenAI({
    apiKey
});

export function getFullCompletion$(prompt: string, model = 'gpt-4o', temperature = 0) {
    const _completion = client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        temperature,
    });

    return from(_completion).pipe(
        map((completion) => {
            const _explanation = completion.choices[0].message.content || 'no explanation received';
            return _explanation;
        }),
    )

    // try {
    //     const response = await fetch(apiUrl, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${apiKey}`, // Authorize with API key
    //         },
    //         body: JSON.stringify({
    //             model: 'text-davinci-003', // Specify the model you want to use
    //             prompt: prompt,
    //             max_tokens: 4096, // Maximum tokens allowed for text-davinci-003
    //             temperature: 0.7, // Adjust for creativity level
    //         }),
    //     });

    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }

    //     const data = await response.json();
    //     return data.choices[0].text.trim();
    // } catch (error) {
    //     console.error("Error calling OpenAI API:", error);
    //     throw error;
    // }
}
