import React from "react"

import { Button, useTheme } from "@availabs/avl-components"

import styled from "styled-components"

export default ({ sections, activeIndex, canGoPrev, prev, canGoNext, next, children, ...props }) => {
  const theme = useTheme();
  return (
    <div className="w-full">
      { sections.length < 2 ? null :
        <>
          <StyledBorderDiv className="text-2xl mb-2"
            width={ ((activeIndex + 1) / sections.length) * 100 }>
            <div className="flex">
              { sections.map((sect, i) =>
                  <div key={ i } className={ `
                    flex-1 font-bold ${ theme.transition }
                    ${ (i === activeIndex) ? theme.text :
                        (i < activeIndex) ? theme.textInfo :
                        theme.textLight }
                  ` }>
                    <div className="pr-6 pl-2">
                      { sect.title || `Page ${ i + 1 }` }
                    </div>
                  </div>
                )
              }
            </div>
          </StyledBorderDiv>
          <div className="flex">
            { sections.length < 2 ? null :
              <Button className="flex-0" disabled={ !canGoPrev }
                onClick={ prev } buttonTheme="buttonInfo">
                prev
              </Button>
            }
            <div className="flex-1 flex justify-end">
              { sections.length < 2 ? null :
                <Button className="flex-0" disabled={ !canGoNext }
                  onClick={ next } buttonTheme="buttonInfo">
                  next
                </Button>
              }
            </div>
          </div>
        </>
      }
      <div>
        { children }
      </div>
    </div>
  )
}

const StyledBorderDiv = styled.div`
  &::after {
    content: "";
    display: block;
    width: ${ props => props.width }%;
    border-bottom: 4px;
    border-style: solid;
    border-color: inherit;
    transition: 0.25s;
  }
`
