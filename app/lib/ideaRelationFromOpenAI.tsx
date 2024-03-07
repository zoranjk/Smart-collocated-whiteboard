import { Editor, TLShapeId, createShapeId } from '@tldraw/tldraw'
import { ResponseShape } from '../ResponseShape/ResponseShape'
import { getSelectionAsImageDataUrl } from './getSelectionAsImageDataUrl'
import {
	GPT4CompletionResponse,
	GPT4Message,
	MessageContent,
	fetchFromOpenAi,
} from './fetchFromOpenAi'

// the system prompt explains to gpt-4 what we want it to do and how it should behave.
const systemPrompt = `You are a very smart and experienced group work facilitator that is able to the relations between ideas on a shared whiteboard so as to stimulate team's mutual awareness and discussion. Your job is to identify the relations among team members. Please use the provided relation types. Plus, output the confidence score of prediction of each relation as well. Each pair of ideas can only have single relation type, do not repeatedly generate relations for a same pair. Return the relations in the provided JSON format.`

const assistantPrompt = `
The relation list is as follow:
{
    "Is a": "Indicates that one concept is a type or category of another.",
    "Part of": "Indicates that one concept is a part of another.",
    "Used for": "Describes what something is used for.",
    "Capable of": "Describes an action or activity that a concept is capable of doing.",
    "At location": "Indicates where something is typically found or where an event occurs.",
    "Has a": "Indicates that one concept possesses another.",
    "Desires": "Indicates a desire or need associated with a concept.",
    "Causes": "Describes an event or action that leads to a particular result.",
    "Has property": "Indicates a characteristic or property of a concept.",
    "Related to": "A general relationship indicating that two concepts are related in some way.",
    "Synonym": "Indicates that two concepts have the same or very similar meanings.",
    "Antonym": "Indicates that two concepts have opposite meanings.",
    "Derived from": "Indicates that one concept is derived from another, often used for words that have a common root or origin.",
    "Instance of": "Similar to IsA, but typically used for instances of a class or category."
  }

The input JSON format is as follow:

The input JSON objects of ideas and topics follow this format:
{
	"ideas": [
		{
			"id": "idea 1 id",
			"text": "text of the idea 1"
		},
		{
			"id": "idea 1 id",
			"text": "text of the idea 1"
		}
		,...
	]
}

The returned JSON object should follow this format:
{
    relations: [
        // list of relations
        {
            "relation": "Relation type betwewen two ideas",
            "srcId: "id of source idea in this relation",
            "dstId": "id of destination idea in this relation",
            "confidence": "confidence score from 0 to 1"
        },
        {
            "relation": "Relation type betwewen two ideas",
            "srcId: "id of source idea in this relation",
            "dstId": "id of destination idea in this relation",
            "confidence": "confidence score from 0 to 1"
        },
        ...
    ]
}

Note you should use group name and idea id provided to you in the input JSON object.
`

// Given frame name and correpsonding ideas, this function will return the relationship between the frames and how to merge two frames
export async function getRelationHints (ideas) {

    // console.log('generateFrameRelation input: ', ideas)

	// first, we build the prompt that we'll send to openai.
	const prompt = await buildPromptForOpenAi(ideas)

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
			throw new Error(openAiResponse.error.message)
		}

		const response = openAiResponse.choices[0].message.content

		const parsed_res = JSON.parse(response)
        return parsed_res.relations
		// populate the response shape with the html we got back from openai.
		// TODO: populate the edges between selected shapes
	} catch (e) {
		// if something went wrong, get rid of the unnecessary response shape

		// TODO: create effect to hide loading edges
		throw e
	}
}

async function buildPromptForOpenAi (ideas) {

	// the user messages describe what the user has done and what they want to do next. they'll get
	// combined with the system prompt to tell gpt-4 what we'd like it to do.
	const userMessages: MessageContent = [
		{
			type: 'text',
			text: 'Here are the input json objects',
		},
		{
			// send the text of all selected shapes, so that GPT can use it as a reference (if anything is hard to see)
			type: 'text',
			text: ideas !== null ? JSON.stringify(ideas) : 'Oh, it looks like there was no input group and idea.',
		}
	]

	// combine the user prompt with the system prompt
	return [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userMessages },
		{ role: 'assistant', content: assistantPrompt },
	]
}