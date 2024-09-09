import os.path
import sys
from rabbit_mq import RabbitMQ


def initialize_rabbit():
    rabbit_mq = None
    try:

        rabbit_mq = RabbitMQ()
        return rabbit_mq

    except KeyboardInterrupt:

        if rabbit_mq is not None:
            rabbit_mq.close_connection()

        print('Interrupted')
        sys.exit(0)


rabbitMQ = initialize_rabbit()
for i in range(0, 9000000):
    status_code = rabbitMQ.publish(message=f"[{i+1}]This is a test message", queue='input')
rabbitMQ.close_connection()