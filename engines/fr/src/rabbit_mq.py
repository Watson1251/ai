import pika
import time
import sys

class RabbitMQ:

    def __init__(self, username='user', password='password', host='rabbitmq', port=5672):
        self.username = username
        self.password = password
        self.host = host
        self.port = port
        self.connection = None
        self.channel = None
        self.connect()

    def connect(self):
        credentials = pika.PlainCredentials(self.username, self.password)
        parameters = pika.ConnectionParameters(
            self.host,
            self.port,
            '/',
            credentials,
            heartbeat=600,  # Adding a heartbeat to keep the connection alive
            blocked_connection_timeout=300  # Timeout to avoid getting stuck
        )
        
        while True:
            try:
                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()
                # Declare queues once connected
                self.channel.queue_declare(queue='image_paths', durable=True)
                print("Connected to RabbitMQ")
                break
            except pika.exceptions.AMQPConnectionError as e:
                print(f"Connection error: {e}, retrying in 5 seconds...")
                time.sleep(5)

    def close_connection(self):
        try:
            if self.connection:
                self.connection.close()
        except Exception as e:
            print("Cannot close connection:", e)

    def reconnect(self):
        print("Reconnecting to RabbitMQ...")
        self.close_connection()
        self.connect()

    def publish(self, message='This is a new message!', queue='image_paths'):
        while True:
            if self.channel is not None:
                try:
                    self.channel.basic_publish(
                        exchange='',
                        routing_key=queue,
                        body=message,
                        properties=pika.BasicProperties(delivery_mode=2,)  # Persistent message
                    )
                    print(f'[*] Published: {message}')
                    return 0
                except (pika.exceptions.StreamLostError, pika.exceptions.AMQPChannelError) as e:
                    print(f"Publish error: {e}, reconnecting...")
                    self.reconnect()
                except pika.exceptions.AMQPConnectionError as e:
                    print(f"Connection error during publish: {e}, reconnecting...")
                    self.reconnect()
            else:
                print("Cannot Publish Message!")
                return 1

    def consume(self, queue='image_paths'):
        while True:
            if self.channel is not None:
                try:
                    method_frame, header_frame, body = self.channel.basic_get(queue=queue, auto_ack=False)
                    if method_frame:
                        print(f'[*] Consuming: {body.decode()}')
                        return body.decode(), method_frame.delivery_tag
                    else:
                        print("No message returned")
                        return None, None
                except (pika.exceptions.StreamLostError, pika.exceptions.AMQPChannelError) as e:
                    print(f"Consume error: {e}, reconnecting...")
                    self.reconnect()
                except pika.exceptions.AMQPConnectionError as e:
                    print(f"Connection error during consume: {e}, reconnecting...")
                    self.reconnect()
            else:
                print("Cannot Consume Message!")
                return None, None

    def ack_message(self, delivery_tag):
        while True:
            if self.channel is not None:
                try:
                    self.channel.basic_ack(delivery_tag)
                    print(f'[*] Acknowledged message with delivery tag: {delivery_tag}')
                    return 0
                except (pika.exceptions.StreamLostError, pika.exceptions.AMQPChannelError) as e:
                    print(f"Stream connection lost: {e}, reconnecting...")
                    self.reconnect()
                except pika.exceptions.ChannelClosedByBroker as e:
                    print(f"Channel closed by broker: {e}, reconnecting...")
                    self.reconnect()
                    return 1
            else:
                print("Cannot Acknowledge Message!")
                return 1
