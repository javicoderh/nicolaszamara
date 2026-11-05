"""Shared editorial boundary. Pure validation: no provider imports or network."""
import hashlib
import ipaddress
import math
import json
import re
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

PROTOCOL = json.loads((Path(__file__).resolve().parents[1] / 'config/blog/protocol.json').read_text(encoding='utf-8'))


class InvalidBlog(ValueError):
    """Stable validation code suitable for the administrative API."""


def text(value, limit, required=True, *, field=''):
    if value is None and not required:
        value = ''
    reason = 'type' if not isinstance(value, str) else 'length' if len(value.strip()) > limit else 'required' if required and not value.strip() else None
    if reason:
        raise InvalidBlog(f'invalid_text:{field}:{reason}' if field else 'invalid_text')
    return value.strip()


def idea(value):
    value = text(value, PROTOCOL['limits']['ideaCharacters'])
    if len(value.split()) > PROTOCOL['limits']['ideaWords']:
        raise InvalidBlog('idea_too_long')
    return value


def slug(value):
    value = text(value, 100)
    value = ''.join(character for character in unicodedata.normalize('NFD',value.lower()) if unicodedata.category(character)!='Mn')
    value = re.sub(r'\s+','-',value)
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value) or value in ('admin', 'sitemap', 'preview', 'api', 'categories'):
        raise InvalidBlog('invalid_slug')
    return value


def url(value, internal=False, media=False, *, field=''):
    value = text(value, 2048, field=field)
    def reject(reason):
        raise InvalidBlog(f'invalid_url:{field}:{reason}' if field else 'invalid_url')
    if media and re.fullmatch(r'/blog-media/[0-9a-f-]{36}', value):
        return value
    if internal and value in PROTOCOL['services'].values():
        return value
    if any(character.isspace() or ord(character) < 32 for character in value) or '\\' in value:
        reject('invalid_characters')
    try:
        parsed = urlsplit(value)
        hostname, port = parsed.hostname, parsed.port
    except ValueError:
        reject('invalid_structure')
    if parsed.scheme != 'https': reject('https_required')
    if not hostname: reject('host_required')
    if parsed.username or parsed.password: reject('credentials_not_allowed')
    if port not in (None, 443): reject('port_not_allowed')
    if any(ord(character) < 32 for character in value) or parsed.hostname.lower() in ('localhost','localhost.localdomain') or parsed.hostname.lower().endswith(('.local','.internal','.localhost')):
        reject('local_address')
    try: address = ipaddress.ip_address(parsed.hostname)
    except ValueError: address = None
    if address and not address.is_global: reject('private_address')
    return value


def strings(value, maximum, limit=500, *, field=''):
    if not isinstance(value, list) or len(value) > maximum:
        raise InvalidBlog('invalid_list')
    return [text(item, limit, field=f'{field}[{index}]' if field else '') for index, item in enumerate(value)]


def optional_reels(value):
    """Keep valid optional links; report rejected ones without inventing repairs."""
    if value is None: return [], []
    if not isinstance(value, list) or len(value) > 10:
        return [], ['invalid_list:reels']
    references, warnings = [], []
    for index, reference in enumerate(value):
        try: normalized = url(reference, field=f'reels[{index}]')
        except InvalidBlog as error:
            warnings.append(str(error)); continue
        if normalized not in references: references.append(normalized)
    return references, warnings


def reference_details(value, references, research=False):
    if not isinstance(value, list) or len(value)>20: raise InvalidBlog('invalid_references')
    result=[]; seen=set()
    for index, item in enumerate(value):
        if not isinstance(item,dict): raise InvalidBlog('invalid_reference')
        path=f'sourceDetails[{index}]'
        reference=url(item.get('url'),field=path+'.url')
        if reference not in references or reference in seen: raise InvalidBlog('invalid_reference')
        seen.add(reference)
        normalized={'url':reference,'title':text(item.get('title',''),300,research,field=path+'.title'),'label':text(item.get('label',''),120,False,field=path+'.label')}
        if research:
            normalized['origin']=item.get('origin','web_search')
            if normalized['origin'] not in ('user','web_search'): raise InvalidBlog('invalid_source_origin')
            normalized['contribution']=text(item.get('contribution'),1000,field=path+'.contribution')
            normalized['claims']=strings(item.get('claims',[]),5,1000,field=path+'.claims')
            normalized['accessedAt']=text(item.get('accessedAt'),40,field=path+'.accessedAt')
            try:
                accessed=datetime.fromisoformat(normalized['accessedAt'].replace('Z','+00:00'))
                if accessed.tzinfo is None: raise ValueError()
                normalized['accessedAt']=accessed.astimezone(timezone.utc).isoformat()
            except ValueError: raise InvalidBlog('invalid_source_date') from None
        result.append(normalized)
    return result


def brief(value):
    if not isinstance(value, dict):
        raise InvalidBlog('invalid_brief')
    result = {}
    for key, catalog in [('objective', 'objectives'), ('target', 'targets')]:
        if value.get(key) not in PROTOCOL[catalog]:
            raise InvalidBlog('invalid_' + key)
        result[key] = value[key]
    result['category']=slug(text(value.get('category'),100,field='category'))
    for key in ('topic', 'angle', 'audienceDescription'):
        result[key] = text(value.get(key), 2000, field=key)
    result['focusKeyword'] = text(value.get('focusKeyword'), 100, field='focusKeyword')
    result['focusKeyword'] = ''.join(char for char in unicodedata.normalize('NFD', result['focusKeyword'].lower()) if unicodedata.category(char) != 'Mn')
    if not 2 <= len(result['focusKeyword'].split()) <= 5:
        raise InvalidBlog('invalid_focus_keyword')
    result['keyPoints'] = strings(value.get('keyPoints'), 5, field='keyPoints')
    if len(result['keyPoints']) < 3:
        raise InvalidBlog('insufficient_key_points')
    result['sources'] = [url(item,field=f'sources[{index}]') for index,item in enumerate(strings(value.get('sources'), 6, 2048, field='sources'))]
    if len(set(result['sources'])) < 2:
        raise InvalidBlog('insufficient_sources')
    result['sourceDetails']=reference_details(value.get('sourceDetails',[]),result['sources'],research=True)
    if len(result['sourceDetails'])<2: raise InvalidBlog('insufficient_source_details')
    decisions = value.get('editorialDecisions', {})
    if not isinstance(decisions, dict):
        raise InvalidBlog('invalid_editorial_decisions')
    result['editorialDecisions']={key:text(decisions.get(key,''),1000,False,field='editorialDecisions.'+key) for key in ('target','objective','category','topic','angle','keyPoints')}
    for key, allowed, default in [('tone', PROTOCOL['tones'], ''), ('narrativeApproach', PROTOCOL['narratives'], 'expositivo'),
                                  ('desiredLength', PROTOCOL['lengths'], 'medium'), ('crawlPolicy', ['index', 'noindex'], 'index'),
                                  ('aiCrawlPolicy', ['allow', 'disallow'], 'allow')]:
        selected = value.get(key, default)
        if selected != default and selected not in allowed:
            raise InvalidBlog('invalid_' + key)
        result[key] = selected
    service = value.get('relatedServiceId')
    if service is not None and (service not in PROTOCOL['services'] or result['objective'] not in ('vender_producto', 'generar_leads')):
        raise InvalidBlog('invalid_service')
    result['relatedServiceId'] = service
    for key in ('seoTitle', 'ogTitle', 'ogDescription', 'desiredSlug', 'externalResourceDescription'):
        result[key] = text(value.get(key, ''), 500, False, field=key)
    if result['desiredSlug']:
        slug(result['desiredSlug'])
    for key in ('externalResourceUrl',):
        result[key] = url(value[key],field=key) if value.get(key) else ''
    result['externalResourceType'] = value.get('externalResourceType', '')
    if result['externalResourceType'] not in ('', 'podcast', 'video', 'document', 'tool'):
        raise InvalidBlog('invalid_resource')
    result['structuredDataType'] = value.get('structuredDataType', 'BlogPosting')
    if result['structuredDataType'] != 'BlogPosting':
        raise InvalidBlog('unsupported_schema')
    result['twitterCard'] = value.get('twitterCard', '')
    if result['twitterCard'] not in ('', 'summary', 'summary_large_image'):
        raise InvalidBlog('invalid_social_card')
    result['internalTags'] = strings(value.get('internalTags', []), 10, 80, field='internalTags')
    result['relatedSlugs'] = [slug(item) for item in strings(value.get('relatedSlugs', []), 3, 100)]
    result['reels'], warnings = optional_reels(value.get('reels', []))
    result['editorialWarnings'] = list(dict.fromkeys(strings(value.get('editorialWarnings', []),20,200) + warnings))
    result['editorialSummary'] = text(value.get('editorialSummary', ''), 4000, False, field='editorialSummary')
    result['protocolVersion'] = PROTOCOL['version']
    return result


def generated_article(value, task_brief):
    if not isinstance(value, dict): raise InvalidBlog('invalid_article')
    value = {**value, 'category': task_brief['category'], 'focusKeyword': task_brief['focusKeyword'], 'reels': task_brief.get('reels',[])}
    value['sourceDetails']=[item for item in task_brief.get('sourceDetails',[]) if item['url'] in value.get('sources',[])]
    for key in ('seoTitle','ogTitle','ogDescription','desiredSlug','relatedServiceId','crawlPolicy','aiCrawlPolicy','twitterCard'):
        if task_brief.get(key): value['slug' if key == 'desiredSlug' else key] = task_brief[key]
    result = text_article(value)
    lower, upper = PROTOCOL['lengths'][task_brief.get('desiredLength', 'medium')]
    if not lower <= result['wordCount'] <= upper:
        raise InvalidBlog('article_length_mismatch')
    if len(set(result['sources'])) < 2 or not set(result['sources']).issubset(set(task_brief['sources'])):
        raise InvalidBlog('article_sources_mismatch')
    for key in ('title', 'summary', 'author'):
        if not result[key]: raise InvalidBlog('article_incomplete')
    return result


def editorial_critique(value):
    if not isinstance(value,dict) or not isinstance(value.get('checks'),list) or not 1<=len(value['checks'])<=20:
        raise InvalidBlog('invalid_critique')
    checks=[]
    for check in value['checks']:
        if not isinstance(check,dict) or type(check.get('passed')) is not bool: raise InvalidBlog('invalid_critique')
        checks.append({'name':text(check.get('name'),120),'passed':check['passed'],'note':text(check.get('note',''),1000,False)})
    return {'checks':checks,'corrections':strings(value.get('corrections',[]),30,1500)}


def text_article(value):
    """Generation delivers text only; image selection belongs to the dashboard."""
    if not isinstance(value, dict): raise InvalidBlog('invalid_article')
    draft = dict(value)
    for field in ('cover', 'coverAlt', 'coverCaption', 'coverPosition', 'ogImage', 'bodyImage'):
        draft.pop(field, None)
    if isinstance(draft.get('document'), dict) and isinstance(draft['document'].get('blocks'), list):
        draft['document'] = {**draft['document'], 'blocks': [block for block in draft['document']['blocks'] if not isinstance(block, dict) or block.get('type') != 'image']}
    return article(draft)


def image_position(value):
    if value is None: value={}
    if not isinstance(value,dict) or set(value)-{'x','y'}: raise InvalidBlog('invalid_image_position')
    point={axis:value.get(axis,50) for axis in ('x','y')}
    if any(type(number) not in (int,float) or not math.isfinite(number) or not 0<=number<=100 for number in point.values()): raise InvalidBlog('invalid_image_position')
    return point


def body_image(value):
    if value is None: value = {}
    if not isinstance(value, dict) or set(value) - {'src', 'alt', 'caption', 'alignment', 'afterBlock','position'}:
        raise InvalidBlog('invalid_body_image')
    alignment = value.get('alignment', 'right')
    after = value.get('afterBlock')
    if alignment not in ('left', 'right') or (after is not None and (type(after) is not int or not 0 <= after < 200)):
        raise InvalidBlog('invalid_image_position')
    return {'src': url(value['src'], media=True) if value.get('src') else '',
            'alt': text(value.get('alt', ''), 400, False), 'caption': text(value.get('caption', ''), 500, False),
            'alignment': alignment, 'afterBlock': after,'position':image_position(value.get('position'))}


def document(value):
    if not isinstance(value, dict) or set(value) != {'version', 'blocks'} or value['version'] != 1:
        raise InvalidBlog('invalid_document')
    blocks = value['blocks']
    if not isinstance(blocks, list) or len(blocks) > PROTOCOL['limits']['blocks']:
        raise InvalidBlog('invalid_blocks')
    if len(json.dumps(value, ensure_ascii=False).encode()) > PROTOCOL['limits']['documentBytes']:
        raise InvalidBlog('document_too_large')
    normalized = []
    for block in blocks:
        if not isinstance(block, dict):
            raise InvalidBlog('invalid_block')
        kind = block.get('type')
        if kind in ('paragraph', 'heading', 'quote'):
            if set(block) - {'type', 'text', 'level'}:
                raise InvalidBlog('unexpected_block_field')
            item = {'type': kind, 'text': text(block.get('text'), 12000)}
            if kind == 'heading':
                if block.get('level') not in (2, 3):
                    raise InvalidBlog('invalid_heading')
                item['level'] = block['level']
        elif kind == 'list':
            if set(block) - {'type', 'items', 'ordered'} or type(block.get('ordered', False)) is not bool:
                raise InvalidBlog('invalid_list')
            item = {'type': kind, 'items': strings(block.get('items'), 30, 2000), 'ordered': block.get('ordered', False)}
        elif kind == 'image':
            if set(block) - {'type', 'src', 'alt', 'caption'}:
                raise InvalidBlog('invalid_image')
            item = {'type': kind, 'src': url(block.get('src'), media=True), 'alt': text(block.get('alt'), 400), 'caption': text(block.get('caption', ''), 500, False)}
        elif kind == 'link':
            if set(block) != {'type', 'text', 'href'}:
                raise InvalidBlog('invalid_link')
            item = {'type': kind, 'text': text(block.get('text'), 500), 'href': url(block.get('href'), internal=True)}
        elif kind == 'separator' and set(block) == {'type'}:
            item = {'type': kind}
        else:
            raise InvalidBlog('unsupported_block')
        normalized.append(item)
    return {'version': 1, 'blocks': normalized}


def article(value, publishing=False):
    if not isinstance(value, dict):
        raise InvalidBlog('invalid_article')
    result = {key: text(value.get(key) if value.get(key) is not None else '', limit, False) for key, limit in
              [('title', 160), ('summary', 400), ('author', 120), ('seoTitle', 200), ('metaDescription', 500),
               ('ogTitle', 200), ('ogDescription', 500), ('coverAlt', 400), ('coverCaption', 500), ('focusKeyword', 100)]}
    for key in ('seoTitle','metaDescription','ogTitle','ogDescription'): result[key]=result[key] or None
    result['slug'] = slug(value['slug']) if value.get('slug') else ''
    result['category'] = slug(value.get('category'))
    result['categoryLabel'] = text(value.get('categoryLabel', PROTOCOL['categories'].get(result['category'], result['category'])), 80)
    for key, limit in [('authorBio',1000),('reviewer',120)]: result[key] = text(value.get(key,''),limit,False)
    result['reviewedAt'] = text(value.get('reviewedAt',''),10,False)
    if result['reviewedAt']:
        try: date.fromisoformat(result['reviewedAt'])
        except ValueError: raise InvalidBlog('invalid_review_date') from None
    result['twitterCard'] = value.get('twitterCard') or 'summary_large_image'
    result['aiCrawlPolicy'] = value.get('aiCrawlPolicy') or 'allow'
    if result['twitterCard'] not in ('summary','summary_large_image') or result['aiCrawlPolicy'] not in ('allow','disallow'): raise InvalidBlog('invalid_social_policy')
    result['document'] = document(value.get('document'))
    if any(block['type'] == 'image' for block in result['document']['blocks']):
        raise InvalidBlog('article_images_separate')
    result['cover'] = url(value['cover'], media=True) if value.get('cover') else ''
    result['coverPosition']=image_position(value.get('coverPosition'))
    result['bodyImage'] = body_image(value.get('bodyImage'))
    result['ogImage'] = url(value['ogImage'], media=True) if value.get('ogImage') else ''
    for key, maximum in [('sources', 20), ('reels', 10)]:
        result[key] = [url(item) for item in strings(value.get(key, []), maximum, 2048)]
    result['sourceDetails']=reference_details(value.get('sourceDetails',[]),result['sources'])
    result['reelDetails']=reference_details(value.get('reelDetails',[]),result['reels'])
    result['internalTags'] = list(dict.fromkeys(strings(value.get('internalTags', []), 10, 80)))
    result['relatedSlugs'] = [slug(item) for item in strings(value.get('relatedSlugs', []), 3, 100)]
    result['crawlPolicy'] = value.get('crawlPolicy', 'index')
    if result['crawlPolicy'] not in ('index', 'noindex'):
        raise InvalidBlog('invalid_crawl_policy')
    result['relatedServiceId'] = value.get('relatedServiceId')
    if result['relatedServiceId'] is not None and result['relatedServiceId'] not in PROTOCOL['services']:
        raise InvalidBlog('invalid_service')
    prose = ' '.join(block.get('text', '') + ' '.join(block.get('items', [])) for block in result['document']['blocks'])
    result['wordCount'] = len(prose.split())
    result['readingMinutes'] = max(1, round(result['wordCount'] / 200))
    encoded = json.dumps(result['document'], ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
    result['contentHash'] = hashlib.sha256(encoded).hexdigest()
    if publishing and (any(not result[key] for key in ('title', 'slug', 'summary', 'author', 'cover', 'coverAlt')) or not result['wordCount']):
        raise InvalidBlog('publication_incomplete')
    if publishing and (not result['bodyImage']['src'] or not result['bodyImage']['alt'] or result['bodyImage']['src'] == result['cover']):
        raise InvalidBlog('article_requires_two_images')
    return result
