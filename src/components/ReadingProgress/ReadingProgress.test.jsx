import { act, render } from '@testing-library/react'
import { expect, it,vi } from 'vitest'
import ReadingProgress from './ReadingProgress.jsx'
import ReadingProgressSkeleton from './ReadingProgressSkeleton.jsx'
import { trackEvent } from '../../services/analyticsService.js'
vi.mock('../../services/analyticsService.js',()=>({trackEvent:vi.fn(()=>true)}))
it('remains decorative and safe while content is loading',()=>{const {container}=render(<ReadingProgress ready={false}/>);expect(container.firstChild).toHaveAttribute('aria-hidden','true');expect(container.querySelector('span')).toHaveStyle({transform:'scaleX(0)'})})
it('reserves two pixels without announcing another loading cycle',()=>{const {container}=render(<ReadingProgressSkeleton/>);expect(container.firstChild).toHaveAttribute('aria-hidden','true')})
it('measures the modal body and sends a single completion signal',()=>{
 const root=document.createElement('div'),body=document.createElement('div');body.className='article-content__body';root.appendChild(body);document.body.appendChild(root)
 body.getBoundingClientRect=()=>({top:0,height:1000});root.getBoundingClientRect=()=>({bottom:950})
 const {unmount}=render(<ReadingProgress articleId="00000000-0000-4000-8000-000000000001" rootRef={{current:root}}/>);
 act(()=>{root.dispatchEvent(new Event('scroll'));root.dispatchEvent(new Event('scroll'))})
 expect(trackEvent).toHaveBeenCalledTimes(1);expect(trackEvent).toHaveBeenCalledWith('blog_read_complete',{article_id:'00000000-0000-4000-8000-000000000001'});unmount();root.remove()
})
