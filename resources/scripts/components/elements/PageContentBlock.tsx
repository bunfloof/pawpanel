import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    return (
        <CSSTransition className='flex flex-col flex-grow' timeout={150} classNames={'fade'} appear in>
            <div className='flex flex-col flex-grow'>
                <div className='flex-grow'>
                    <ContentContainer className={`my-4 sm:my-10 ${className || ''}`}>
                        {showFlashKey && <FlashMessageRender byKey={showFlashKey} className='mb-4' />}
                        {children}
                    </ContentContainer>
                </div>
                <ContentContainer>
                    <p className='text-center text-neutral-500 text-xs py-4'>
                        <a
                            rel='noopener nofollow noreferrer'
                            href='https://pterodactyl.io'
                            target='_blank'
                            className='no-underline text-neutral-500 hover:text-neutral-300'
                        >
                            Pterodactyl&reg;
                        </a>
                        &nbsp;&copy; 2015 - {new Date().getFullYear()}
                    </p>
                </ContentContainer>
            </div>
        </CSSTransition>
    );
};

export default PageContentBlock;
