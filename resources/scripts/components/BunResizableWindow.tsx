import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faRedo } from '@fortawesome/free-solid-svg-icons';
import PowerButtons from '@/components/server/console/PowerButtons';

interface WindowProps {
    children: ReactNode;
    title: string;
    onClose: () => void;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

const globalStyles = `
  .no-select {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
  }
`;

function getResizeCursor(direction: string): string {
    switch (direction) {
        case 'n':
        case 's':
            return 'cursor-ns-resize';
        case 'e':
        case 'w':
            return 'cursor-ew-resize';
        case 'nw':
        case 'se':
            return 'cursor-nwse-resize';
        case 'ne':
        case 'sw':
            return 'cursor-nesw-resize';
        default:
            return 'cursor-default';
    }
}

export const BunResizableWindow: React.FC<WindowProps> = ({ children, title, onClose }) => {
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 300, height: 610 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection>('se');
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const [isInteracting, setIsInteracting] = useState(false);

    const heightOffset = 34; // adjustable

    const dispatchCustomResizeEvent = () => {
        console.log('dispatched resize event');
        window.dispatchEvent(new Event('resize'));
    };

    const updateContentHeight = () => {
        if (contentRef.current) {
            const newContentHeight = contentRef.current.scrollHeight;
            console.log('wow');
            console.log(newContentHeight);
            setContentHeight(newContentHeight);

            setSize((prevSize) => ({
                ...prevSize,
                height: Math.min(prevSize.height, newContentHeight + heightOffset),
            }));
        }
    };

    useEffect(() => {
        updateContentHeight();

        const observer = new MutationObserver(updateContentHeight);
        if (contentRef.current) {
            observer.observe(contentRef.current, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
            });
        }

        window.addEventListener('resize', updateContentHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateContentHeight);
        };
    }, []);

    const handleStart = (clientX: number, clientY: number) => {
        if (windowRef.current) {
            const rect = windowRef.current.getBoundingClientRect();
            setDragOffset({
                x: clientX - rect.left,
                y: clientY - rect.top + window.scrollY,
            });
        }
        setIsDragging(true);
        setIsInteracting(true);
        document.body.classList.add('no-select');
    };

    const handleResizeStart = (direction: ResizeDirection) => (event: React.MouseEvent | React.TouchEvent) => {
        event.stopPropagation();
        setIsResizing(true);
        setIsInteracting(true);
        setResizeDirection(direction);
        document.body.classList.add('no-select');
    };

    const handleEnd = () => {
        setIsDragging(false);
        setIsResizing(false);
        setIsInteracting(false);
        document.body.classList.remove('no-select');
    };

    const constrainPosition = (x: number, y: number, width: number, height: number) => {
        const maxHeight = contentHeight + heightOffset;
        const maxY = Math.max(document.documentElement.scrollHeight, window.innerHeight) - height;
        const constrainedHeight = Math.min(height, maxHeight);
        console.log(`constrainPos height now ${constrainedHeight}`);
        return {
            x: Math.max(0, Math.min(x, window.innerWidth - width)),
            y: Math.max(0, Math.min(y, maxY)),
            height: constrainedHeight,
        };
    };

    useEffect(() => {
        const handleMove = (clientX: number, clientY: number) => {
            if (isDragging) {
                console.log('isDragging');
                dispatchCustomResizeEvent();
                const newPosition = constrainPosition(
                    clientX - dragOffset.x,
                    clientY - dragOffset.y + window.scrollY,
                    size.width,
                    size.height
                );
                setPosition(newPosition);
                setSize((prevSize) => ({ ...prevSize, height: newPosition.height }));
            } else if (isResizing) {
                console.log('isResizing');
                dispatchCustomResizeEvent();
                let newWidth = size.width;
                let newHeight = size.height;
                let newX = position.x;
                let newY = position.y;

                if (resizeDirection.includes('e')) {
                    newWidth = Math.max(200, Math.min(clientX - position.x, window.innerWidth - position.x));
                }
                if (resizeDirection.includes('s')) {
                    const maxHeight = Math.min(
                        contentHeight + heightOffset,
                        Math.max(document.documentElement.scrollHeight, window.innerHeight) - position.y
                    );
                    newHeight = Math.max(100, Math.min(clientY + window.scrollY - position.y, maxHeight));
                }
                if (resizeDirection.includes('w')) {
                    const newRight = position.x + size.width;
                    newX = Math.max(0, Math.min(clientX, newRight - 200));
                    newWidth = newRight - newX;
                }
                if (resizeDirection.includes('n')) {
                    const newBottom = position.y + size.height;
                    newY = Math.max(0, Math.min(clientY + window.scrollY, newBottom - 100));
                    newHeight = Math.min(contentHeight + heightOffset, newBottom - newY);
                }

                const constrainedPosition = constrainPosition(newX, newY, newWidth, newHeight);
                setSize({ width: newWidth, height: constrainedPosition.height });
                setPosition(constrainedPosition);
            }
        };

        const handleMouseMove = (event: MouseEvent) => {
            handleMove(event.clientX, event.clientY);
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (isInteracting) {
                event.preventDefault();
                const touch = event.touches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        };
        const handleResize = () => {
            setPosition((prevPosition) => constrainPosition(prevPosition.x, prevPosition.y, size.width, size.height));
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize);

        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize);
            document.body.classList.remove('no-select');
        };
    }, [isDragging, isResizing, position, size, dragOffset, resizeDirection, contentHeight, isInteracting]);

    useEffect(() => {
        dispatchCustomResizeEvent();
    }, [size.width, size.height]);

    const [key, setKey] = useState(0);

    const handleRerender = () => {
        setKey((prevKey) => prevKey + 1);
    };

    return (
        <>
            <style>{globalStyles}</style>
            <div
                ref={windowRef}
                className='fixed bg-neutral-800 border rounded-md border-neutral-500 shadow-lg flex flex-col overflow-hidden'
                style={{
                    top: `${position.y}px`,
                    left: `${position.x}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    minWidth: '200px',
                    minHeight: '100px',
                    zIndex: 9999,
                }}
                onTouchMove={(e) => {
                    if (isInteracting) {
                        e.preventDefault();
                    }
                }}
            >
                <div
                    className='bg-black p-2 text-xs cursor-move select-none flex justify-between items-center'
                    onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        handleStart(touch.clientX, touch.clientY);
                    }}
                >
                    <div className='flex items-center'>
                        <span>{title}</span>
                        <button
                            onClick={handleRerender}
                            className='ml-2 text-white hover:text-blue-500 focus:outline-none'
                            title='Rerender content'
                        >
                            <FontAwesomeIcon icon={faRedo} />
                        </button>
                    </div>
                    <button onClick={onClose} className='text-white hover:text-neutral-500 focus:outline-none'>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className='flex-1 overflow-auto'>
                    <div ref={contentRef} className='bg-blue-900' key={key}>
                        {children}
                    </div>
                    {/* Floating overlay div */}
                    <div
                        className='absolute top-8 left-1/2 transform -translate-x-1/2 bg-transparent text-black rounded shadow-sm'
                        style={{ zIndex: 10000 }}
                    >
                        <PowerButtons className='flex sm:justify-end space-x-1 scale-[0.7] transform origin-center' />
                    </div>
                </div>
                {['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].map((direction) => (
                    <div
                        key={direction}
                        className={`absolute bg-transparent ${getResizeCursor(direction)} z-50`}
                        style={{
                            top: direction.includes('n') ? 0 : 'auto',
                            bottom: direction.includes('s') ? 0 : 'auto',
                            left: direction.includes('w') ? 0 : 'auto',
                            right: direction.includes('e') ? 0 : 'auto',
                            width: ['n', 's'].includes(direction) ? 'calc(100% - 10px)' : 10,
                            height: ['e', 'w'].includes(direction) ? 'calc(100% - 10px)' : 10,
                            cursor: getResizeCursor(direction),
                        }}
                        onMouseDown={handleResizeStart(direction as ResizeDirection)}
                        onTouchStart={handleResizeStart(direction as ResizeDirection)}
                    />
                ))}
            </div>
        </>
    );
};
