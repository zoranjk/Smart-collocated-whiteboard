import { Editor, TLShapeId, createShapeId } from '@tldraw/tldraw'
import {
	GPT4Message,
	MessageContent,
	fetchFromOpenAi,
} from './fetchFromOpenAi'

// the system prompt explains to gpt-4 what we want it to do and how it should behave.
const systemPrompt = `You are a smart team discussion facilitator that helps a group of people to collaborate on certain topic. During the discussion, different team members may create notes representing their ideas about the topic. Your task is to figure out the essential points between their ideas that they can discuss about or collaborate on. Return the response in the provided JSON format.`

const assistantPrompt = `
The input JSON objects follow this format:
[
    {
	"text": "text of the edited note",
    "author": "user name"
    },
    {
        "text": "text of the edited note",
        "author": "user name"
    },
    ...
]

The returned JSON objects should follow this format:
{
    "collaboration_point": [
        {
            "point": "Summary of the essential points between the ideas that they can discuss about or collaborate on",
            "collaborators": [ "user name 1", "user name 2", ...] // the list of users who should discuss about the essential points
        }
    ]
}

Only return a single paragraph summarizing the edits from different users.
`

export async function generateCollaborationPoint ({ideas, topic=""}) {
	// first, we build the prompt that we'll send to openai.
	const prompt = await buildPromptForOpenAi({ideas, topic})

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
			response_format: { type: 'json_object' },
			max_tokens: 4096,
			temperature: 0,
			messages: prompt,
		})

		if (openAiResponse.error) {
            console.log(openAiResponse)
			throw new Error(openAiResponse.error.message)
		}

		const response = openAiResponse.choices[0].message.content

		
		const parsed_res = JSON.parse(response)
		console.log('openAiResponse: ', parsed_res)

		return parsed_res.collaboration_point

		// populate the response shape with the html we got back from openai.
		// TODO: populate the edges between selected shapes
	} catch (e) {
		// if something went wrong, get rid of the unnecessary response shape

		// TODO: create effect to hide loading edges
		throw e
	}
}

async function buildPromptForOpenAi ({ideas, topic}): Promise<GPT4Message[]> {
	const userMessages: MessageContent = [
		{
			type: 'text',
			text: 'Below is the input JSON representing the existing ideas:',
		},
		{
			// send the text of all selected shapes, so that GPT can use it as a reference (if anything is hard to see)
			type: 'text',
			text: ideas.length > 0 ? JSON.stringify(ideas) : 'Oh, it looks like there was not any note.',
		},
        {
			// send the text of all selected shapes, so that GPT can use it as a reference (if anything is hard to see)
			type: 'text',
			text: topic != "" ? "The topic of the current discussion is about: " + topic : 'Oh, it looks like they do not target a particular discussion topic.',
		},
	]

	// combine the user prompt with the system prompt
	return [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userMessages },
		{ role: 'assistant', content: assistantPrompt },
	]
}
