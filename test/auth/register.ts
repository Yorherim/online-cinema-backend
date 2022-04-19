import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { disconnect } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MockAppModule } from '../mock-app.module';
import { AuthDto } from '../../src/auth/dto/registration.dto';
import { AuthErrorMessages } from '../../src/utils/error-messages';

let app: INestApplication;

const testRegistrationDto: AuthDto = {
	email: 'test@test.com',
	password: '12345',
};

beforeEach(async () => {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [MockAppModule],
	}).compile();

	app = moduleFixture.createNestApplication();
	app.useGlobalPipes(new ValidationPipe());

	await app.init();
});

afterAll(async () => {
	await disconnect();
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const authRegister = () => {
	it('success - create new user', async () => {
		return request(app.getHttpServer())
			.post('/auth/register')
			.send(testRegistrationDto)
			.expect(201)
			.then(({ body }: request.Response) => {
				expect(body.user._id).toBeDefined();
				expect(body.user.email).toBe('test@test.com');
				expect(body.user.isAdmin).toBeFalsy();
				expect(body.refreshToken).toBeDefined();
				expect(body.accessToken).toBeDefined();
			});
	});

	it('fail - create new user with already registered email', async () => {
		return request(app.getHttpServer())
			.post('/auth/register')
			.send(testRegistrationDto)
			.expect(409)
			.then(({ body }: request.Response) => {
				expect(body.message).toBe(AuthErrorMessages.EMAIL_ALREADY_REGISTERED);
			});
	});

	describe('validate registration DTO', () => {
		it('fail - invalid email', async () => {
			return request(app.getHttpServer())
				.post('/auth/register')
				.send({ ...testRegistrationDto, email: 'blaaa' })
				.expect(400)
				.then(({ body }: request.Response) => {
					expect(body.message[0]).toBe(AuthErrorMessages.EMAIL_NOT_VALID);
				});
		});

		it('fail - short password', async () => {
			return request(app.getHttpServer())
				.post('/auth/register')
				.send({ ...testRegistrationDto, password: '123' })
				.expect(400)
				.then(({ body }: request.Response) => {
					expect(body.message[0]).toBe(AuthErrorMessages.PASSWORD_LONG);
				});
		});

		it('fail - too long password', async () => {
			return request(app.getHttpServer())
				.post('/auth/register')
				.send({
					...testRegistrationDto,
					password:
						'342354325435324534534534534534534444444444444444444444444444444444444',
				})
				.expect(400)
				.then(({ body }: request.Response) => {
					expect(body.message[0]).toBe(AuthErrorMessages.PASSWORD_LONG);
				});
		});
	});
};
