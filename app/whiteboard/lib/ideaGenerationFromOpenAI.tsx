import { Editor, TLShapeId, createShapeId } from '@tldraw/tldraw'
import {
	GPT4CompletionResponse,
	GPT4Message,
	MessageContent,
	fetchFromOpenAi,
} from './fetchFromOpenAi'

// the system prompt explains to gpt-4 what we want it to do and how it should behave.
const systemPrompt = `Imagine you're the GPT-4 AI, assigned to support a team in their brainstorming session. Your task is to generate at most 8 high-level ideas by referring to the existing ones and the topics under consideration. If user provide instruction, please provide ideas relevant to user requirement. Each idea should be concise. Note that there could be no idea existed at the time. Return the idea suggestions in the provided JSON format.`

const assistantPrompt = `
The returned JSON objects should follow this format:
{
    "ideas": [
        {
            "text": "description of suggestion 1",
        },
        {
            "text": "description of suggestion 2",
        },
		...
    ]
}
`

export async function generateIdeas ({ existing_ideas, topic="", instruction="" }) {

	// first, we build the prompt that we'll send to openai.
	const prompt = await buildSuggestionPromptForOpenAi(existing_ideas, topic, instruction)

	// TODO: create effect to show loading edges

	try {
		// If you're using the API key input, we preference the key from there.
		// It's okay if this is undefined—it will just mean that we'll use the
		// one in the .env file instead.
		const apiKeyFromDangerousApiKeyInput = (
			document.body.querySelector('#openai_key_risky_but_cool') as HTMLInputElement
		)?.value

		// make a request to openai. `fetchFromOpenAi` is a next.js server action,
		// so our api key is hidden.
		const openAiResponse = await fetchFromOpenAi(apiKeyFromDangerousApiKeyInput, {
			model: 'gpt-4-1106-preview',
			// model: process.env.MODEL_VERSION,
			response_format: { type: 'json_object' },
			max_tokens: 4096,
			temperature: 0,
			messages: prompt,
		})

		if (openAiResponse.error) {
			throw new Error(openAiResponse.error.message)
		}

		const response = openAiResponse.choices[0].message.content

		
		const parsed_res = JSON.parse(response)
		console.log('openAiResponse: ', parsed_res)

		return parsed_res.ideas

		// populate the response shape with the html we got back from openai.
		// TODO: populate the edges between selected shapes
	} catch (e) {
		// if something went wrong, get rid of the unnecessary response shape

		// TODO: create effect to hide loading edges
		throw e
	}
}

async function buildSuggestionPromptForOpenAi (existing_ideas, topic, instruction): Promise<GPT4Message[]> {

	// the user messages describe what the user has done and what they want to do next. they'll get
	// combined with the system prompt to tell gpt-4 what we'd like it to do.

    const text = `Existing ideas: ${existing_ideas.map((idea) => idea).join(', ')}; Topic: ${topic ? topic : "No topic is provided"}` 


	const userMessages: MessageContent = [
		{
			type: 'text',
			text: 'Here are existing ideas and topic.',
		},
		{
			// send the text of all selected shapes, so that GPT can use it as a reference (if anything is hard to see)
			type: 'text',
			text: text !== '' ? text : 'Oh, it looks like there was not any note.',
		},
        {
            type: 'text',
            text:  instruction !== '' ? "Following is user instruction for idea generation instruction: " + instruction : 'No instruction is provided, you should generate ideas based on the existing ideas and the topic.'
        }
	]

	// combine the user prompt with the system prompt
	return [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userMessages },
		{ role: 'assistant', content: assistantPrompt },
	]
}