import 'jest';
import {Utils} from '../../src/util/Utils';



const sut = new Utils();
test('check is new date', () => {
  const now = new Date();
  const old = new Date();
  old.setHours(now.getHours()-24);
  const result = sut.isNewDate(now, old);
  expect(result).toBeTruthy();
});


test('check is new date', () => {
  const now = new Date();
  const old = new Date();
  old.setHours(now.getHours()-25);
  const result = sut.isNewDate(now, old);
  expect(result).toBeTruthy();
});


test('check is new date - 23 hours', () => {
  const now = new Date();
  const old = new Date();
  old.setHours(now.getHours() - 23);
  old.setMinutes(0);
  const result = sut.isNewDate(now, old);
  expect(result).toBeFalsy();
});

test('check is new date - 2 hours ', () => {
  const now = new Date();
  const old = new Date();
  old.setHours(now.getHours()-2);

  const result = sut.isNewDate(now, old);
  expect(result).toBeFalsy();
});