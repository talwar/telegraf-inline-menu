import {InputFile, ParseMode} from 'telegraf/typings/telegram-types'

import {hasTruthyKey, isObject} from './generic-types'

export type Body = string | TextBody | MediaBody

export type MediaType = 'animation' | 'audio' | 'document' | 'photo' | 'video'
export const MEDIA_TYPES: readonly MediaType[] = ['animation', 'audio', 'document', 'photo', 'video']

interface TextPart {
	readonly text: string;
	readonly parse_mode?: ParseMode;
}

export interface TextBody extends TextPart {
	readonly disable_web_page_preview?: boolean;
}

export interface MediaBody extends Partial<TextPart> {
	readonly type: MediaType;
	readonly media: InputFile;
}

function isKnownMediaType(type: unknown): type is MediaType {
	if (typeof type !== 'string') {
		return false
	}

	return (MEDIA_TYPES as readonly string[]).includes(type)
}

export function jsUserBodyHints(body: Body): void {
	if (typeof body === 'string') {
		return
	}

	if (!isObject(body)) {
		throw new TypeError('The body has to be a string or an object. Check the telegraf-inline-menu Documentation.')
	}

	if ('media' in body) {
		if (!isKnownMediaType(body.type)) {
			throw new TypeError('When you have a MediaBody you need to specify its type like \'photo\' or \'video\'')
		}
	} else if (typeof body.text !== 'string') {
		throw new TypeError('The body has to contain at least media or text. Check the telegraf-inline-menu Documentation.')
	}
}

export function isTextBody(body: Body): body is string | TextBody {
	if (typeof body === 'string') {
		return true
	}

	if (!isObject(body)) {
		return false
	}

	if (body.type !== undefined && body.type !== 'text') {
		return false
	}

	return hasTruthyKey(body, 'text')
}

export function isMediaBody(body: Body): body is MediaBody {
	if (!isObject(body)) {
		return false
	}

	if (!isKnownMediaType(body.type)) {
		return false
	}

	return hasTruthyKey(body, 'media')
}

export function getBodyText(body: TextBody | string): string {
	return typeof body === 'string' ? body : body.text
}
