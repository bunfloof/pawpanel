import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`sticky top-0 w-full h-12 bg-black shadow overflow-x-auto backdrop-blur-md z-10`};
    border-bottom: 1px solid #424d5c;
    & > div > .no-hover-effect:hover::before {
        ${tw`bg-transparent`};
    }

    & > div > .no-hover-effect:hover {
        ${tw`text-neutral-300`};
    }

    & > div > .no-hover-effect:active::after,
    & > div > .no-hover-effect.active::after {
        opacity: 0;
    }
    & > div > .no-highlight {
        outline: none !important;
        box-shadow: none !important;
        user-select: none !important;
    }

    & > div {
        ${tw`flex items-center text-sm mx-auto px-2`};
        max-width: 100%;

        & > a,
        & > div {
            ${tw`relative inline-flex items-center py-3 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150 z-10`};

            &:not(:first-of-type) {
                ${tw`ml-0`};
            }

            &::before {
                content: '';
                ${tw`absolute inset-1 bg-transparent rounded-md transition-all duration-150`};
                z-index: -1;
            }

            &::after {
                content: '';
                ${tw`absolute left-4 right-4 h-0.5 bg-transparent`};
                bottom: -3px; // Adjust this value to move the shadow further down
                box-shadow: inset 0 -2px ${theme`colors.cyan.600`.toString()};
                opacity: 0;
            }

            &:hover {
                ${tw`text-neutral-100`};

                &::before {
                    ${tw`bg-neutral-500`};
                }
            }

            &:active,
            &.active {
                ${tw`text-neutral-100`};

                &::after {
                    opacity: 1;
                }
            }
        }
    }
`;

export default SubNavigation;
