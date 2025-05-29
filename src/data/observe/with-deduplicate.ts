/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

import { Data } from "data/data";
import { equals } from "data/functions/equals";
import { Observe } from "./observe";

/**
 * Creates a new Observe function that will cache the last value and only notify observers when the value changes.
 * Performs a deep comparison of the value to determine if it has changed.
 */
export function withDeduplicate<T>(
  observable: Observe<T>
): Observe<T> {
  return (observer) => {
    let lastValue: T | undefined = undefined;
    return observable((value) => {
      const notify = lastValue === undefined || !equals(lastValue, value);
      if (notify) {
        lastValue = value;
        observer(value);
      }
    });
  };
}
